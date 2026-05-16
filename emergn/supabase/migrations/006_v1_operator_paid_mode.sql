-- EMERGN. V1 operator-paid mode: backfill training credits for existing users.
-- New users receive 5 training credits via lib/credits.ts ensureUserCreditBalance().
-- This migration grants the same to anyone whose balance row predates the change.

alter table public.user_credit_balances
  alter column training_credits set default 5;

update public.user_credit_balances
   set training_credits = 5
 where coalesce(training_credits, 0) = 0;
