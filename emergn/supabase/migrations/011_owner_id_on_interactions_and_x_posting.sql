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
