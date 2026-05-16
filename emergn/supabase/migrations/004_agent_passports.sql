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
