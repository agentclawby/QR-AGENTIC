alter table public.agent_tokens
  drop constraint if exists agent_tokens_status_check;

alter table public.agent_tokens
  add constraint agent_tokens_status_check
  check (status in ('pending', 'prepared', 'submitted', 'launched', 'failed', 'graduated'));
