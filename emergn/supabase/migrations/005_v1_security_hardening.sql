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
