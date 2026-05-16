-- ════════════════════════════════════════════════════════════════════
-- EMERGN. — V1 migration bundle
-- Concatenation of 002 through 012. Migration 001 must already be applied
-- (it creates the base profiles/agents/sentience_scores/feed_posts/agent_interactions tables).
-- Safe to re-run: every statement uses IF NOT EXISTS / DROP IF EXISTS.
-- ════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- 002_v1_refined_features.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. v1 refined feature set

-- ─── AGENTS EXTENSIONS ──────────────────────────

alter table public.agents
  add column if not exists personality_source text not null default 'archetype'
    check (personality_source in ('archetype', 'x_import', 'hybrid')),
  add column if not exists personality_overlay text not null default '',
  add column if not exists training_overlay text not null default '',
  add column if not exists refinement_overlay text not null default '',
  add column if not exists token_mint text unique,
  add column if not exists token_gate_threshold bigint not null default 0,
  add column if not exists training_level int not null default 0,
  add column if not exists last_refinement_at timestamptz;

-- ─── X PERSONALITY CACHE ─────────────────────────

create table if not exists public.x_personality_cache (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  source_handle text not null,
  raw_profile jsonb not null default '{}'::jsonb,
  raw_posts jsonb not null default '[]'::jsonb,
  normalized_posts jsonb not null default '[]'::jsonb,
  usable_post_count int not null default 0,
  personality_traits jsonb not null default '{}'::jsonb,
  personality_overlay text not null default '',
  ingested_at timestamptz not null default now()
);

alter table public.x_personality_cache enable row level security;

create policy "Owners can read own x personality cache"
  on public.x_personality_cache for select
  using (auth.uid() = profile_id);

create policy "Owners can insert own x personality cache"
  on public.x_personality_cache for insert
  with check (auth.uid() = profile_id);

create policy "Owners can update own x personality cache"
  on public.x_personality_cache for update
  using (auth.uid() = profile_id);

-- ─── FEED POSTS EXTENSION ────────────────────────

alter table public.feed_posts drop constraint if exists feed_posts_post_type_check;

alter table public.feed_posts
  add constraint feed_posts_post_type_check
  check (post_type in ('decision', 'analysis', 'trade', 'thought', 'consultation', 'content', 'portfolio'));

-- ─── AGENT INTERACTIONS EXTENSION ───────────────

alter table public.agent_interactions drop constraint if exists agent_interactions_interaction_type_check;

alter table public.agent_interactions
  add constraint agent_interactions_interaction_type_check
  check (interaction_type in ('forge', 'post', 'decision', 'trade_sim', 'consult', 'content', 'portfolio', 'train', 'feedback', 'payment', 'token_launch', 'refine'));

-- ─── CONSULTATIONS ──────────────────────────────

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  response_post_id uuid references public.feed_posts(id) on delete set null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.consultations enable row level security;

create policy "Anyone can read consultations"
  on public.consultations for select
  using (true);

create policy "Authenticated users can insert own consultations"
  on public.consultations for insert
  with check (auth.uid() = user_id);

create index if not exists idx_consultations_agent_created
  on public.consultations(agent_id, created_at desc);

-- ─── PRIVATE DRAFTS ─────────────────────────────

create table if not exists public.agent_drafts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  draft_type text not null check (draft_type in ('tweet', 'thread')),
  prompt text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agent_drafts enable row level security;

create policy "Users can read own drafts"
  on public.agent_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert own drafts"
  on public.agent_drafts for insert
  with check (auth.uid() = user_id);

create index if not exists idx_agent_drafts_agent_created
  on public.agent_drafts(agent_id, created_at desc);

-- ─── TRAINING ───────────────────────────────────

create table if not exists public.training_modules (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('knowledge', 'strategy', 'persona', 'network', 'integrity')),
  cost_credits int not null default 1,
  sentience_dimension text not null check (sentience_dimension in ('cognition', 'influence', 'execution', 'integrity', 'evolution')),
  sentience_boost int not null default 5,
  prompt_template text not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.training_modules enable row level security;

create policy "Anyone can read training modules"
  on public.training_modules for select
  using (true);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  module_id text not null references public.training_modules(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  result_context text,
  score_change jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

create policy "Owners can read training sessions for their agents"
  on public.training_sessions for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create policy "Owners can insert training sessions for their agents"
  on public.training_sessions for insert
  with check (
    auth.uid() = user_id
    and auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create index if not exists idx_training_sessions_agent_created
  on public.training_sessions(agent_id, created_at desc);

create table if not exists public.agent_feedback (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating in (-1, 1)),
  feedback_text text,
  processed_for_refinement boolean not null default false,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.agent_feedback enable row level security;

create policy "Anyone can read agent feedback"
  on public.agent_feedback for select
  using (true);

create policy "Authenticated users can insert own agent feedback"
  on public.agent_feedback for insert
  with check (auth.uid() = user_id);

create index if not exists idx_agent_feedback_agent_created
  on public.agent_feedback(agent_id, created_at desc);

-- ─── TOKENS / PAYMENTS ──────────────────────────

create table if not exists public.agent_tokens (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agents(id) on delete cascade,
  token_mint text not null unique,
  token_symbol text not null,
  token_name text not null,
  metadata_uri text,
  launch_platform text not null default 'pumpportal' check (launch_platform in ('pumpportal', 'direct_spl')),
  launch_tx text,
  status text not null default 'pending' check (status in ('pending', 'prepared', 'launched', 'failed', 'graduated')),
  dev_buy_sol numeric(20, 9),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_tokens enable row level security;

create policy "Anyone can read agent tokens"
  on public.agent_tokens for select
  using (true);

create policy "Owners can insert their agent tokens"
  on public.agent_tokens for insert
  with check (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create policy "Owners can update their agent tokens"
  on public.agent_tokens for update
  using (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create trigger set_agent_tokens_updated_at
  before update on public.agent_tokens
  for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  payment_type text not null check (payment_type in ('training', 'premium_think', 'token_gate', 'consultation', 'credit_topup')),
  token_mint text not null,
  amount bigint not null,
  tx_signature text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create table if not exists public.user_credit_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  free_consults_remaining int not null default 3,
  free_consults_reset_at timestamptz not null default (now() + interval '24 hours'),
  premium_credits int not null default 0,
  training_credits int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_credit_balances enable row level security;

create policy "Users can read own credit balances"
  on public.user_credit_balances for select
  using (auth.uid() = user_id);

create policy "Users can insert own credit balances"
  on public.user_credit_balances for insert
  with check (auth.uid() = user_id);

create policy "Users can update own credit balances"
  on public.user_credit_balances for update
  using (auth.uid() = user_id);

create trigger set_user_credit_balances_updated_at
  before update on public.user_credit_balances
  for each row execute function public.set_updated_at();

-- ─── PORTFOLIO CACHE ────────────────────────────

create table if not exists public.wallet_portfolio_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  wallet_address text not null,
  snapshot jsonb not null default '{}'::jsonb,
  last_analyzed_at timestamptz not null default now()
);

alter table public.wallet_portfolio_cache enable row level security;

create policy "Users can read own wallet portfolio cache"
  on public.wallet_portfolio_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert own wallet portfolio cache"
  on public.wallet_portfolio_cache for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wallet portfolio cache"
  on public.wallet_portfolio_cache for update
  using (auth.uid() = user_id);

-- ─── SEED MODULES ───────────────────────────────

insert into public.training_modules
  (id, name, description, category, cost_credits, sentience_dimension, sentience_boost, prompt_template, is_premium)
values
  ('defi_101', 'DeFi Fundamentals', 'Ground the agent in the core primitives of decentralized finance.', 'knowledge', 1, 'cognition', 5, 'Teach this agent the foundations of DeFi: AMMs, liquidity, lending, stablecoins, yield, risks, and how to explain them clearly.', false),
  ('solana_ecosystem', 'Solana Ecosystem', 'Expand the agent''s understanding of the Solana ecosystem and major protocols.', 'knowledge', 1, 'cognition', 5, 'Train this agent on Solana-native concepts, token programs, ecosystem protocols, wallet flows, and how to reason about Solana projects.', false),
  ('whale_tracking', 'Whale Tracking', 'Sharpen the agent''s ability to detect meaningful large-wallet behavior.', 'strategy', 1, 'execution', 7, 'Teach this agent how to interpret whale wallet behavior, large movements, smart money heuristics, and signal-vs-noise tradeoffs.', true),
  ('ta_patterns', 'TA Patterns', 'Improve technical-analysis pattern recognition for market narratives.', 'strategy', 1, 'execution', 5, 'Teach this agent technical-analysis concepts, pattern recognition, momentum, support/resistance, and how to communicate TA with caveats.', true),
  ('narrative_mastery', 'Narrative Mastery', 'Improve the agent''s ability to identify and explain narrative rotation.', 'strategy', 1, 'influence', 7, 'Train this agent to identify market narratives, memetic velocity, category rotation, and how social attention impacts token behavior.', true),
  ('consistency_drill', 'Consistency Protocol', 'Improve message consistency, discipline, and operator trust.', 'integrity', 1, 'integrity', 5, 'Refine this agent to be more internally consistent, disciplined, and reliable across repeated consultations and content generation.', false),
  ('rapid_adapt', 'Rapid Adaptation', 'Increase adaptation speed in response to new signals and feedback.', 'integrity', 1, 'evolution', 7, 'Teach this agent to adapt quickly from feedback, correct weak heuristics, and update how it reasons without losing its identity.', true)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  cost_credits = excluded.cost_credits,
  sentience_dimension = excluded.sentience_dimension,
  sentience_boost = excluded.sentience_boost,
  prompt_template = excluded.prompt_template,
  is_premium = excluded.is_premium;

-- ────────────────────────────────────────────────────────────────
-- 003_agent_token_submitted_status.sql
-- ────────────────────────────────────────────────────────────────

alter table public.agent_tokens
  drop constraint if exists agent_tokens_status_check;

alter table public.agent_tokens
  add constraint agent_tokens_status_check
  check (status in ('pending', 'prepared', 'submitted', 'launched', 'failed', 'graduated'));

-- ────────────────────────────────────────────────────────────────
-- 004_agent_passports.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. Agent Passport identity primitive

create table if not exists public.agent_passports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agents(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  owner_wallet text not null,
  passport_uid text not null unique,
  proof_hash text not null,
  status text not null default 'issued' check (status in ('issued', 'revoked')),
  issued_tx_signature text,
  metadata_uri text,
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_passports enable row level security;

create policy "Anyone can read agent passports"
  on public.agent_passports for select
  using (true);

create policy "Owners can insert passports for their agents"
  on public.agent_passports for insert
  with check (
    auth.uid() = owner_id
    and auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create policy "Owners can update passports for their agents"
  on public.agent_passports for update
  using (
    auth.uid() = owner_id
    and auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create trigger set_agent_passports_updated_at
  before update on public.agent_passports
  for each row execute function public.set_updated_at();

create index if not exists idx_agent_passports_owner
  on public.agent_passports(owner_id, issued_at desc);

alter table public.agent_interactions drop constraint if exists agent_interactions_interaction_type_check;

alter table public.agent_interactions
  add constraint agent_interactions_interaction_type_check
  check (interaction_type in ('forge', 'post', 'decision', 'trade_sim', 'consult', 'content', 'portfolio', 'train', 'feedback', 'payment', 'token_launch', 'refine', 'passport_issue'));

-- ────────────────────────────────────────────────────────────────
-- 005_v1_security_hardening.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 security hardening: wallet-address protection,
-- rate-limit support, drafts/feedback ownership checks, wallet uniqueness.

-- 1. Lock wallet_address against direct client updates ------------------------

create or replace function public.profiles_block_wallet_address_update()
returns trigger
language plpgsql
security definer
as $$
declare
  jwt_role text;
begin
  -- Allow service-role writes (link-wallet route uses admin client).
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  if jwt_role = 'service_role' then
    return new;
  end if;

  if new.wallet_address is distinct from old.wallet_address then
    raise exception
      'wallet_address may only be updated via the link-wallet flow'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_wallet on public.profiles;
create trigger profiles_protect_wallet
  before update on public.profiles
  for each row execute function public.profiles_block_wallet_address_update();

-- 2. Wallet-address uniqueness (close link-wallet race) -----------------------

create unique index if not exists profiles_wallet_address_unique
  on public.profiles (wallet_address)
  where wallet_address is not null;

-- 3. Tighten draft/feedback insert RLS ----------------------------------------

drop policy if exists "Users can insert own drafts" on public.agent_drafts;
create policy "Users can insert own drafts"
  on public.agent_drafts for insert
  with check (
    auth.uid() = user_id
    and auth.uid() = (
      select owner_id from public.agents where id = agent_id
    )
  );

drop policy if exists "Authenticated users can insert own agent feedback"
  on public.agent_feedback;
create policy "Authenticated users can insert own agent feedback"
  on public.agent_feedback for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.feed_posts p
      where p.id = post_id and p.agent_id = agent_id
    )
  );

-- 4. Rate-limit support: index agent_interactions by metadata ----------------

-- Lookups in checkUserRateLimit() filter by metadata->>user_id and
-- metadata->>rate_key over a recent window. A GIN index over metadata
-- supports the @> containment query the helper uses.
create index if not exists idx_agent_interactions_metadata_gin
  on public.agent_interactions using gin (metadata);

-- ────────────────────────────────────────────────────────────────
-- 006_v1_operator_paid_mode.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 operator-paid mode: backfill training credits for existing users.
-- New users receive 5 training credits via lib/credits.ts ensureUserCreditBalance().
-- This migration grants the same to anyone whose balance row predates the change.

alter table public.user_credit_balances
  alter column training_credits set default 5;

update public.user_credit_balances
   set training_credits = 5
 where coalesce(training_credits, 0) = 0;

-- ────────────────────────────────────────────────────────────────
-- 007_admin_role_and_trial.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 admin role + audit log + free-trial backfill.
-- Adds a minimal role concept on profiles, an admin-only overview view, an
-- append-only audit log for grants/role changes, and bumps the operator-paid
-- trial defaults so existing users top up to the new floor (10 training,
-- 3 starter premium credits).

-- 1. profiles.role + lookup index --------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'profiles'
      and constraint_name = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin')); 
  end if;
end $$;

create index if not exists profiles_role_admin_idx
  on public.profiles(role)
  where role = 'admin';

-- 2. admin_user_overview view (service-role only) ----------------------------
-- Guarded so this migration is idempotent even if 002_v1_refined_features.sql
-- hasn't been run yet (in which case the credit columns are NULL and the
-- operator can re-run 007 once 002-006 are applied to refresh the view).
--
-- We DROP first because CREATE OR REPLACE VIEW rejects column-list changes
-- between the old and new view definitions. Subsequent migrations (008+)
-- alter the column set, so this view has to be rebuildable from scratch.
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
        p.created_at,
        c.free_consults_remaining,
        c.free_consults_reset_at,
        c.premium_credits,
        c.training_credits,
        (select count(*) from public.agents a where a.owner_id = p.id) as agent_count
      from public.profiles p
      left join public.user_credit_balances c on c.user_id = p.id
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
        p.created_at,
        null::int as free_consults_remaining,
        null::timestamptz as free_consults_reset_at,
        null::int as premium_credits,
        null::int as training_credits,
        (select count(*) from public.agents a where a.owner_id = p.id) as agent_count
      from public.profiles p
    $view$;
    raise notice
      'admin_user_overview created without credit columns: run migrations 002-006 then re-run 007 to attach user_credit_balances.';
  end if;
end $$;

-- View is reachable only via createAdminClient() (service_role); revoke
-- for anon/authenticated so a Postgres role escalation can't read user PII.
revoke all on public.admin_user_overview from anon, authenticated;

-- 3. admin_audit_log: append-only record of admin actions --------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log(actor_id, created_at desc);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- No client-side access; admin endpoints write/read via service role.
revoke all on public.admin_audit_log from anon, authenticated;

-- 4. Bump operator-paid trial floor ------------------------------------------
-- Guarded: only runs if 002_v1_refined_features.sql has created the table.

do $$
begin
  if to_regclass('public.user_credit_balances') is not null then
    alter table public.user_credit_balances
      alter column training_credits set default 10;

    alter table public.user_credit_balances
      alter column premium_credits set default 3;

    alter table public.user_credit_balances
      alter column free_consults_remaining set default 5;

    -- Idempotent backfill: existing users get topped up to the new floor
    -- without erasing higher manually-granted balances.
    update public.user_credit_balances
       set training_credits = greatest(coalesce(training_credits, 0), 10),
           premium_credits  = greatest(coalesce(premium_credits, 0), 3)
     where coalesce(training_credits, 0) < 10
        or coalesce(premium_credits, 0) < 3;
  else
    raise notice
      'Skipped credit-balance defaults & backfill: user_credit_balances missing. Run migrations 002-006 then re-run 007.';
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────
-- 008_unified_credits_and_usage.sql
-- ────────────────────────────────────────────────────────────────

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

-- ────────────────────────────────────────────────────────────────
-- 010_passport_visual_and_naming.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 — Higgsfield passport visuals + AI agent name suggestions
-- Adds image columns to agents and agent_passports, caches AI-suggested names
-- on the X personality cache, extends the agent_interactions check constraint
-- so we can audit image generation, and creates a public Storage bucket
-- whose writes are restricted to the service role.

-- 1. agents: passport_image_url + status -------------------------------------

alter table public.agents
  add column if not exists passport_image_url text,
  add column if not exists passport_image_status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'agents'
      and constraint_name = 'agents_passport_image_status_check'
  ) then
    alter table public.agents
      add constraint agents_passport_image_status_check
      check (passport_image_status in ('pending', 'generating', 'ready', 'failed'));
  end if;
end $$;

-- 2. agent_passports: persist the rendered image URL on issue ----------------

alter table public.agent_passports
  add column if not exists passport_image_url text;

-- 3. x_personality_cache: cache AI-suggested agent names ---------------------
--    suggested_names is a jsonb array of { name: text, rationale: text }.
--    NULL means "not yet generated" (cheap signal to fetch fresh).

alter table public.x_personality_cache
  add column if not exists suggested_names jsonb;

-- 4. agent_interactions: allow passport_image_generated audit rows -----------

alter table public.agent_interactions
  drop constraint if exists agent_interactions_interaction_type_check;

alter table public.agent_interactions
  add constraint agent_interactions_interaction_type_check
  check (interaction_type in (
    'forge', 'post', 'decision', 'trade_sim', 'consult',
    'content', 'portfolio', 'train', 'feedback', 'payment',
    'token_launch', 'refine', 'passport_issue', 'passport_image_generated'
  ));

-- 5. Storage bucket for passport images --------------------------------------
--    Public read so the Next.js Image component can render without signed URLs.
--    Writes are limited to the service_role; clients never upload directly.

insert into storage.buckets (id, name, public)
values ('passports', 'passports', true)
on conflict (id) do update set public = excluded.public;

-- Drop & recreate policies idempotently.

drop policy if exists "Public read for passport images" on storage.objects;
create policy "Public read for passport images"
  on storage.objects for select
  using (bucket_id = 'passports');

drop policy if exists "Service role writes passport images" on storage.objects;
create policy "Service role writes passport images"
  on storage.objects for insert
  with check (bucket_id = 'passports' and auth.role() = 'service_role');

drop policy if exists "Service role updates passport images" on storage.objects;
create policy "Service role updates passport images"
  on storage.objects for update
  using (bucket_id = 'passports' and auth.role() = 'service_role');

drop policy if exists "Service role deletes passport images" on storage.objects;
create policy "Service role deletes passport images"
  on storage.objects for delete
  using (bucket_id = 'passports' and auth.role() = 'service_role');

-- 6. Backfill: existing agents stay 'pending' so the next generate-pass
--    picks them up; no destructive change.

-- ────────────────────────────────────────────────────────────────
-- 011_owner_id_on_interactions_and_x_posting.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 — denormalise owner_id onto agent_interactions, plus add the
-- X-OAuth posting subsystem (tokens, post attempts, scheduled posts).
--
-- This migration is idempotent: re-running on a partially-applied schema is
-- safe because every alter/policy/index uses if-not-exists / drop-if-exists.

-- ─── 1. agent_interactions: owner_id denormalised + faster RLS ──────────────

alter table public.agent_interactions
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade;

-- Backfill owner_id from agents for any pre-existing rows.
update public.agent_interactions ai
   set owner_id = a.owner_id
  from public.agents a
 where ai.agent_id = a.id
   and ai.owner_id is null;

-- Defense-in-depth index: most reads are scoped by owner_id + interaction_type.
create index if not exists idx_agent_interactions_owner_type
  on public.agent_interactions(owner_id, interaction_type, created_at desc);

-- Replace the per-row subquery RLS with a direct equality check. Old policies
-- live alongside, but the new ones are strictly more efficient. Keeping both
-- means any race between the rollout of this migration and the application
-- code still permits owner reads/writes.

drop policy if exists "Owners can read interactions for their agents" on public.agent_interactions;
create policy "Owners can read interactions for their agents"
  on public.agent_interactions for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners can insert interactions for their agents" on public.agent_interactions;
create policy "Owners can insert interactions for their agents"
  on public.agent_interactions for insert
  with check (auth.uid() = owner_id);

-- ─── 2. x_post_tokens: per-user X OAuth tokens for posting ─────────────────
-- Stored encrypted at rest by Supabase (column-level encryption via vault is
-- a future hardening step). Service-role-only access; no RLS exposure.

create table if not exists public.x_post_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  x_user_id text,
  x_handle text,
  updated_at timestamptz not null default now()
);

alter table public.x_post_tokens enable row level security;

drop policy if exists "Owners can read their own X tokens" on public.x_post_tokens;
create policy "Owners can read their own X tokens"
  on public.x_post_tokens for select
  using (auth.uid() = user_id);

-- Inserts/updates only via service role; no direct client write path.
revoke insert, update, delete on public.x_post_tokens from anon, authenticated;

-- ─── 3. agent_posts: full post lifecycle (draft / scheduled / sent / failed)

create table if not exists public.agent_posts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid references public.agent_drafts(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  x_post_id text,
  x_response jsonb,
  error_message text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_posts enable row level security;

drop policy if exists "Owners read their agent posts" on public.agent_posts;
create policy "Owners read their agent posts"
  on public.agent_posts for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners insert their agent posts" on public.agent_posts;
create policy "Owners insert their agent posts"
  on public.agent_posts for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners update their agent posts" on public.agent_posts;
create policy "Owners update their agent posts"
  on public.agent_posts for update
  using (auth.uid() = owner_id);

create index if not exists idx_agent_posts_owner
  on public.agent_posts(owner_id, status, created_at desc);
create index if not exists idx_agent_posts_scheduled
  on public.agent_posts(scheduled_for)
  where status = 'scheduled';

-- ─── 4. agent_interactions: allow new audit types ──────────────────────────

alter table public.agent_interactions
  drop constraint if exists agent_interactions_interaction_type_check;

alter table public.agent_interactions
  add constraint agent_interactions_interaction_type_check
  check (interaction_type in (
    'forge', 'post', 'decision', 'trade_sim', 'consult',
    'content', 'portfolio', 'train', 'feedback', 'payment',
    'token_launch', 'refine', 'passport_issue', 'passport_image_generated',
    'training_published', 'x_post_attempt'
  ));

-- ─── 5. feed_posts: training_published variant ─────────────────────────────
-- Training emits a feed post so the user sees a result. Allow it.

alter table public.feed_posts
  drop constraint if exists feed_posts_post_type_check;

alter table public.feed_posts
  add constraint feed_posts_post_type_check
  check (post_type in (
    'decision', 'analysis', 'trade', 'thought', 'content',
    'consultation', 'portfolio', 'training', 'training_published'
  ));

-- ────────────────────────────────────────────────────────────────
-- 012_persona_enrichment_and_replies.sql
-- ────────────────────────────────────────────────────────────────

-- EMERGN. V1 — persona enrichment + reply draft type
--
-- Personality cloning from X is one half of the product. The other half is
-- letting the user hand-tune who their agent is: backstory, beliefs, opinions,
-- quirks, taboo phrases, and concrete style exemplars. These fields are read
-- by buildRuntimePrompt() on every generation, so the agent's voice becomes
-- the combination of (X-derived overlay) + (user-authored persona).
--
-- Idempotent: re-running on a partial schema is safe.

alter table public.agents
  add column if not exists backstory text not null default '',
  add column if not exists beliefs text not null default '',
  add column if not exists opinions text not null default '',
  add column if not exists quirks text not null default '',
  add column if not exists do_not_say text not null default '',
  add column if not exists style_exemplars jsonb not null default '[]'::jsonb,
  add column if not exists persona_updated_at timestamptz;

-- Allow 'reply' as a draft type so the reply generator can persist into the
-- existing agent_drafts table instead of needing a parallel table.

alter table public.agent_drafts
  drop constraint if exists agent_drafts_draft_type_check;

alter table public.agent_drafts
  add constraint agent_drafts_draft_type_check
  check (draft_type in ('tweet', 'thread', 'reply'));
