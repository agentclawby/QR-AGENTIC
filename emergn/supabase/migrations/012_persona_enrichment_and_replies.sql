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
