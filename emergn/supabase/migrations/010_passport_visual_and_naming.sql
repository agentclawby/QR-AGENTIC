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
