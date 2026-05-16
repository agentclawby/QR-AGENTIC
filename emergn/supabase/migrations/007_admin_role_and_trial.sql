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
