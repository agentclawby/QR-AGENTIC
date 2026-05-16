-- EMERGN. V1 — fix wallet-write trigger to use auth.role() instead of the
-- legacy `request.jwt.claim.role` GUC.
--
-- Bug: migration 005's `profiles_block_wallet_address_update` reads
-- `current_setting('request.jwt.claim.role', true)`. Newer PostgREST stores
-- JWT claims in `request.jwt.claims` (JSON object) instead of individual
-- `request.jwt.claim.<key>` GUCs. The legacy lookup returns '' on those
-- Supabase versions, the trigger falls through to the block branch, and
-- EVERY wallet update — including the legitimate service-role one from
-- /api/auth/link-wallet — gets rejected with 23514:
--
--     "wallet_address may only be updated via the link-wallet flow"
--
-- Symptom on the client: "Failed to link wallet". Passport issuance then
-- fails downstream because the wallet never linked.
--
-- Fix: replace the GUC read with `auth.role()`, the Supabase helper that
-- consults BOTH locations (legacy `request.jwt.claim.role` AND the modern
-- `request.jwt.claims ->> 'role'`). Idempotent — `create or replace` swaps
-- the function in place; the trigger keeps pointing at it.

create or replace function public.profiles_block_wallet_address_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Service-role writes (link-wallet route uses the admin client) pass
  -- through. auth.role() reads whichever JWT GUC Supabase's PostgREST
  -- happens to be using on this project.
  if auth.role() = 'service_role' then
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
