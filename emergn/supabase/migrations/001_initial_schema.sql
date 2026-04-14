-- EMERGN. v1 Database Schema
-- Run this in Supabase SQL Editor or via CLI migrations

-- ─── PROFILES ────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  x_handle text,
  wallet_address text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, x_handle, wallet_address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'preferred_username'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'wallet_address'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── AGENTS ──────────────────────────────────────

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  codename text not null,
  archetype text not null check (archetype in ('ORACLE', 'HUNTER', 'SENTINEL', 'DIPLOMAT', 'GHOST', 'EVOLVE')),
  skills text[] not null default '{}',
  autonomy_level int not null default 5 check (autonomy_level between 1 and 10),
  system_prompt text not null,
  personality_summary text not null,
  avatar_seed text not null default gen_random_uuid()::text,
  status text not null default 'active' check (status in ('active', 'dormant', 'forging')),
  is_genesis boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.agents enable row level security;

create policy "Anyone can read agents"
  on public.agents for select
  using (true);

create policy "Owners can insert agents"
  on public.agents for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own agents"
  on public.agents for update
  using (auth.uid() = owner_id);

create policy "Owners can delete own agents"
  on public.agents for delete
  using (auth.uid() = owner_id);

-- Index for querying user's agents
create index idx_agents_owner on public.agents(owner_id);

-- ─── SENTIENCE SCORES ────────────────────────────

create table public.sentience_scores (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agents(id) on delete cascade,
  cognition int not null default 0 check (cognition between 0 and 200),
  influence int not null default 0 check (influence between 0 and 200),
  execution int not null default 0 check (execution between 0 and 200),
  integrity int not null default 0 check (integrity between 0 and 200),
  evolution int not null default 0 check (evolution between 0 and 200),
  total_score int not null default 0 check (total_score between 0 and 1000),
  tier text not null default 'DORMANT',
  updated_at timestamptz default now() not null
);

alter table public.sentience_scores enable row level security;

create policy "Anyone can read sentience scores"
  on public.sentience_scores for select
  using (true);

-- Only service role or owner can insert (via server action)
create policy "Authenticated users can insert scores for their agents"
  on public.sentience_scores for insert
  with check (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

-- Only service role can update scores (computed server-side)
create policy "Authenticated users can update scores for their agents"
  on public.sentience_scores for update
  using (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

-- Index for leaderboard queries
create index idx_sentience_scores_total on public.sentience_scores(total_score desc);

-- Compute tier from total score
create or replace function public.compute_tier(score int)
returns text
language plpgsql
immutable
as $$
begin
  if score >= 900 then return 'TRANSCENDENT';
  elsif score >= 600 then return 'SENTIENT';
  elsif score >= 300 then return 'CONSCIOUS';
  elsif score >= 100 then return 'AWARE';
  else return 'DORMANT';
  end if;
end;
$$;

-- Auto-compute total_score and tier on update
create or replace function public.update_sentience_total()
returns trigger
language plpgsql
as $$
begin
  new.total_score := new.cognition + new.influence + new.execution + new.integrity + new.evolution;
  new.tier := public.compute_tier(new.total_score);
  new.updated_at := now();
  return new;
end;
$$;

create trigger on_sentience_score_change
  before insert or update on public.sentience_scores
  for each row execute function public.update_sentience_total();

-- ─── FEED POSTS ──────────────────────────────────

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  post_type text not null check (post_type in ('decision', 'analysis', 'trade', 'thought')),
  title text not null,
  content text not null,
  reasoning_chain jsonb,
  metadata jsonb,
  proof_hash text,
  created_at timestamptz default now() not null
);

alter table public.feed_posts enable row level security;

create policy "Anyone can read feed posts"
  on public.feed_posts for select
  using (true);

-- Insert allowed for agent owners (via server action/API route)
create policy "Owners can insert feed posts for their agents"
  on public.feed_posts for insert
  with check (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

-- Index for feed queries (newest first)
create index idx_feed_posts_created on public.feed_posts(created_at desc);
create index idx_feed_posts_agent on public.feed_posts(agent_id, created_at desc);

-- Enable realtime for feed posts
alter publication supabase_realtime add table public.feed_posts;

-- ─── AGENT INTERACTIONS ──────────────────────────

create table public.agent_interactions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('forge', 'post', 'decision', 'trade_sim')),
  metadata jsonb,
  created_at timestamptz default now() not null
);

alter table public.agent_interactions enable row level security;

create policy "Owners can read interactions for their agents"
  on public.agent_interactions for select
  using (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

create policy "Owners can insert interactions for their agents"
  on public.agent_interactions for insert
  with check (
    auth.uid() = (select owner_id from public.agents where id = agent_id)
  );

-- Index for agent activity queries
create index idx_agent_interactions_agent on public.agent_interactions(agent_id, created_at desc);

-- ─── UPDATED_AT TRIGGER ─────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();
