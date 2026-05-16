-- EMERGN. V1 unified credit pool, daily usage caps, suspension controls,
-- earn-by-X-post claim ledger, and X-handle uniqueness.
--
-- Idempotent + guarded: any block that depends on a prior migration's table
-- skips silently if the table is missing, so the file can run before/after
-- 002-007 in any order.

-- 1. Unified action_credits pool on user_credit_balances ---------------------

do $$
begin
  if to_regclass('public.user_credit_balances') is not null then
    alter table public.user_credit_balances
      add column if not exists action_credits int not null default 5;
    alter table public.user_credit_balances
      add column if not exists action_credits_earned_today int not null default 0;
    alter table public.user_credit_balances
      add column if not exists action_credits_earned_reset_at timestamptz
        not null default now() + interval '24 hours';
    alter table public.user_credit_balances
      add column if not exists last_action_at timestamptz;

    -- One-time backfill: collapse legacy pools without erasing higher balances.
    update public.user_credit_balances
       set action_credits = greatest(
         coalesce(action_credits, 0),
         coalesce(training_credits, 0) + coalesce(premium_credits, 0)
       );
  else
    raise notice
      'Skipped action_credits column add: user_credit_balances missing. Run migrations 002-007 then re-run 008.';
  end if;
end $$;

-- 2. profiles: suspension, quota override, X-handle uniqueness ---------------

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists usage_quota_overrides jsonb not null default '{}'::jsonb;

create unique index if not exists profiles_x_handle_unique
  on public.profiles(lower(x_handle))
  where x_handle is not null;

-- 3. user_usage_daily — per-user per-day counters ---------------------------

create table if not exists public.user_usage_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  x_calls int not null default 0,
  anthropic_tokens int not null default 0,
  consults int not null default 0,
  trainings int not null default 0,
  primary key (user_id, day)
);

create index if not exists user_usage_daily_day_idx
  on public.user_usage_daily(day desc);

alter table public.user_usage_daily enable row level security;

-- Service role only; admin endpoints query via createAdminClient().
revoke all on public.user_usage_daily from anon, authenticated;

-- 4. credit_claims — earn-by-posting ledger ---------------------------------

create table if not exists public.credit_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid not null references public.agent_drafts(id) on delete cascade,
  tweet_id text not null,
  tweet_url text not null,
  similarity numeric(4,3) not null,
  status text not null check (status in ('approved','rejected','manual_review')),
  reason text,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_claims_tweet_unique
  on public.credit_claims(tweet_id);

create index if not exists credit_claims_user_idx
  on public.credit_claims(user_id, created_at desc);

create index if not exists credit_claims_status_idx
  on public.credit_claims(status, created_at desc);

alter table public.credit_claims enable row level security;
revoke all on public.credit_claims from anon, authenticated;

-- 5. Refresh admin_user_overview to expose new fields ------------------------
-- DROP first because the column shape differs from migration 007's version
-- (added action_credits/usage/suspension fields, reordered columns).
-- CREATE OR REPLACE VIEW only permits appending columns to the end with
-- matching prefix — any reorder/removal forces a rebuild.
drop view if exists public.admin_user_overview cascade;

do $$
begin
  if to_regclass('public.user_credit_balances') is not null then
    execute $view$
      create or replace view public.admin_user_overview as
      select
        p.id,
        p.username,
        p.display_name,
        p.x_handle,
        p.wallet_address,
        p.role,
        p.suspended_at,
        p.suspended_reason,
        p.usage_quota_overrides,
        p.created_at,
        c.action_credits,
        c.action_credits_earned_today,
        c.action_credits_earned_reset_at,
        c.last_action_at,
        c.free_consults_remaining,
        c.premium_credits,
        c.training_credits,
        u.x_calls,
        u.anthropic_tokens,
        u.consults,
        u.trainings,
        (select count(*) from public.agents a where a.owner_id = p.id) as agent_count
      from public.profiles p
      left join public.user_credit_balances c on c.user_id = p.id
      left join public.user_usage_daily u
        on u.user_id = p.id and u.day = current_date
    $view$;
  else
    execute $view$
      create or replace view public.admin_user_overview as
      select
        p.id,
        p.username,
        p.display_name,
        p.x_handle,
        p.wallet_address,
        p.role,
        p.suspended_at,
        p.suspended_reason,
        p.usage_quota_overrides,
        p.created_at,
        null::int as action_credits,
        null::int as action_credits_earned_today,
        null::timestamptz as action_credits_earned_reset_at,
        null::timestamptz as last_action_at,
        null::int as free_consults_remaining,
        null::int as premium_credits,
        null::int as training_credits,
        null::int as x_calls,
        null::int as anthropic_tokens,
        null::int as consults,
        null::int as trainings,
        (select count(*) from public.agents a where a.owner_id = p.id) as agent_count
      from public.profiles p
    $view$;
    raise notice
      'admin_user_overview created without credit/usage columns: run 002-007 then re-run 008.';
  end if;
end $$;

revoke all on public.admin_user_overview from anon, authenticated;
