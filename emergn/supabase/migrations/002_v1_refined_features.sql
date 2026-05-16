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
