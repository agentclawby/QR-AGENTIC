import type { SupabaseClient } from "@supabase/supabase-js";

function envCount(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

// V1 ships in operator-paid mode with a single unified credit pool.
// 1 credit = 1 train OR 1 consult OR 1 content draft. X-retrain costs 2.
// Legacy fields (free_consults, premium_credits, training_credits) stay
// readable for transition / rollback but no route writes them anymore.
const DEFAULT_ACTION_CREDITS = envCount("DEFAULT_ACTION_CREDITS", 5);
export const MAX_ACTION_CREDITS = envCount("MAX_ACTION_CREDITS", 50);
export const MAX_EARNED_CREDITS_PER_DAY = envCount(
  "MAX_EARNED_CREDITS_PER_DAY",
  3,
);

// Legacy defaults retained so back-fills/inserts keep migration 002's NOT NULL
// columns happy until a future migration drops them.
const DEFAULT_FREE_CONSULTS = envCount("DEFAULT_FREE_CONSULTS", 5);
const DEFAULT_TRAINING_CREDITS = envCount("DEFAULT_TRAINING_CREDITS", 10);
const DEFAULT_PREMIUM_CREDITS = envCount("DEFAULT_PREMIUM_CREDITS", 3);

export interface UserCreditState {
  id: string;
  user_id: string;
  // Unified pool
  action_credits: number;
  action_credits_earned_today: number;
  action_credits_earned_reset_at: string;
  last_action_at: string | null;
  // Legacy (read-only post-migration; kept for rollback)
  free_consults_remaining: number;
  free_consults_reset_at: string;
  premium_credits: number;
  training_credits: number;
}

export class InsufficientCreditsError extends Error {
  status = 402;
  constructor(
    public required: number,
    public available: number,
  ) {
    super(
      `Need ${required} credit${required === 1 ? "" : "s"}; you have ${available}.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

export class EarnCapReachedError extends Error {
  status = 429;
  constructor(public limit: number) {
    super(`Daily earn cap reached (${limit}). Try again tomorrow.`);
    this.name = "EarnCapReachedError";
  }
}

export function buildUnavailableCreditBalance(userId: string): UserCreditState {
  return {
    id: "unavailable",
    user_id: userId,
    action_credits: 0,
    action_credits_earned_today: 0,
    action_credits_earned_reset_at: new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString(),
    last_action_at: null,
    free_consults_remaining: 0,
    free_consults_reset_at: new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString(),
    premium_credits: 0,
    training_credits: 0,
  };
}

export async function ensureUserCreditBalance(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: existing, error: readError } = await supabase
    .from("user_credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to read user credit balance: ${readError.message}`);
  }

  if (!existing) {
    const { data: created, error } = await supabase
      .from("user_credit_balances")
      .insert({
        user_id: userId,
        action_credits: DEFAULT_ACTION_CREDITS,
        free_consults_remaining: DEFAULT_FREE_CONSULTS,
        training_credits: DEFAULT_TRAINING_CREDITS,
        premium_credits: DEFAULT_PREMIUM_CREDITS,
      })
      .select("*")
      .single();

    if (error || !created) {
      throw new Error(
        `Failed to initialize user credit balance: ${
          error?.message ?? "missing created row"
        }`,
      );
    }

    return created as UserCreditState;
  }

  // Roll over the earn-cap window if expired.
  const earnReset = new Date(
    existing.action_credits_earned_reset_at ?? 0,
  ).getTime();
  if (Number.isFinite(earnReset) && Date.now() >= earnReset) {
    const nextReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: rolled } = await supabase
      .from("user_credit_balances")
      .update({
        action_credits_earned_today: 0,
        action_credits_earned_reset_at: nextReset,
      })
      .eq("user_id", userId)
      .lte("action_credits_earned_reset_at", new Date().toISOString())
      .select("*");
    if (rolled && rolled.length > 0) return rolled[0] as UserCreditState;
  }

  // Legacy daily-free-consults reset preserved for back-compat.
  const resetAt = new Date(existing.free_consults_reset_at).getTime();
  if (Number.isNaN(resetAt) || Date.now() < resetAt) {
    return existing as UserCreditState;
  }

  const nowIso = new Date().toISOString();
  const nextReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: resetRows } = await supabase
    .from("user_credit_balances")
    .update({
      free_consults_remaining: DEFAULT_FREE_CONSULTS,
      free_consults_reset_at: nextReset,
    })
    .eq("user_id", userId)
    .lte("free_consults_reset_at", nowIso)
    .select("*");

  if (resetRows && resetRows.length > 0) {
    return resetRows[0] as UserCreditState;
  }

  const { data: latest, error: latestError } = await supabase
    .from("user_credit_balances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (latestError || !latest) {
    throw new Error(
      `Failed to read user credit balance after reset race: ${
        latestError?.message ?? "missing latest row"
      }`,
    );
  }

  return latest as UserCreditState;
}

export async function updateUserCredits(
  supabase: SupabaseClient,
  userId: string,
  changes: Partial<
    Pick<
      UserCreditState,
      | "action_credits"
      | "action_credits_earned_today"
      | "action_credits_earned_reset_at"
      | "last_action_at"
      | "free_consults_remaining"
      | "free_consults_reset_at"
      | "premium_credits"
      | "training_credits"
    >
  >,
) {
  const { data, error } = await supabase
    .from("user_credit_balances")
    .update(changes)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to update user credits");
  }

  return data as UserCreditState;
}

export async function getActionCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const balance = await ensureUserCreditBalance(supabase, userId);
  return balance.action_credits ?? 0;
}

// Atomic deduction via compare-and-swap. The update is gated on
// `action_credits` matching the value we just read — Postgres takes a row
// lock during the UPDATE, so concurrent calls that have already decremented
// no longer match and their update returns zero rows. We retry a small
// number of times so two simultaneous legitimate calls don't both fail.
//
// Without this, two concurrent /consult calls could both observe
// `action_credits = 1`, both pass the threshold check, both write 0 — net
// result: two actions burned for one credit.
const DEDUCT_RETRY_LIMIT = 3;

export async function deductActionCredits(
  supabase: SupabaseClient,
  userId: string,
  cost: number,
): Promise<UserCreditState> {
  if (cost <= 0) throw new Error("deductActionCredits: cost must be positive");

  for (let attempt = 0; attempt < DEDUCT_RETRY_LIMIT; attempt++) {
    const balance = await ensureUserCreditBalance(supabase, userId);
    const available = balance.action_credits ?? 0;
    if (available < cost) {
      throw new InsufficientCreditsError(cost, available);
    }

    const { data, error } = await supabase
      .from("user_credit_balances")
      .update({
        action_credits: available - cost,
        last_action_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("action_credits", available)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update user credits: ${error.message}`);
    }
    if (data) {
      return data as UserCreditState;
    }

    // Zero rows updated = a concurrent writer decremented between our read
    // and our update. Loop and re-read.
  }

  // Lost the race DEDUCT_RETRY_LIMIT times. Surface as InsufficientCredits
  // if the most recent read was actually below cost, else as a generic
  // error — both are recoverable at the route layer (402 / 500).
  const final = await ensureUserCreditBalance(supabase, userId);
  const available = final.action_credits ?? 0;
  if (available < cost) {
    throw new InsufficientCreditsError(cost, available);
  }
  throw new Error("Failed to deduct credits — contention exceeded retry limit");
}

// Awards earn-loop credits, capped per-day. Caller is responsible for any
// idempotency check (e.g. the credit_claims unique constraint on tweet_id).
// CAS-style to avoid double-award races.
export async function awardActionCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<UserCreditState> {
  if (amount <= 0) throw new Error("awardActionCredits: amount must be positive");

  for (let attempt = 0; attempt < DEDUCT_RETRY_LIMIT; attempt++) {
    const balance = await ensureUserCreditBalance(supabase, userId);
    const earnedToday = balance.action_credits_earned_today ?? 0;
    if (earnedToday + amount > MAX_EARNED_CREDITS_PER_DAY) {
      throw new EarnCapReachedError(MAX_EARNED_CREDITS_PER_DAY);
    }

    const currentTotal = balance.action_credits ?? 0;
    const nextTotal = Math.min(MAX_ACTION_CREDITS, currentTotal + amount);

    const { data, error } = await supabase
      .from("user_credit_balances")
      .update({
        action_credits: nextTotal,
        action_credits_earned_today: earnedToday + amount,
      })
      .eq("user_id", userId)
      .eq("action_credits", currentTotal)
      .eq("action_credits_earned_today", earnedToday)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to award credits: ${error.message}`);
    }
    if (data) {
      return data as UserCreditState;
    }
    // Concurrent writer changed action_credits or earned_today; retry.
  }

  throw new Error("Failed to award credits — contention exceeded retry limit");
}

// Operator grants — capped at MAX_ACTION_CREDITS to prevent foot-guns.
// CAS-style for parity with deduct/award.
export async function grantActionCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<UserCreditState> {
  for (let attempt = 0; attempt < DEDUCT_RETRY_LIMIT; attempt++) {
    const balance = await ensureUserCreditBalance(supabase, userId);
    const currentTotal = balance.action_credits ?? 0;
    const next = Math.min(MAX_ACTION_CREDITS, currentTotal + amount);

    const { data, error } = await supabase
      .from("user_credit_balances")
      .update({ action_credits: next })
      .eq("user_id", userId)
      .eq("action_credits", currentTotal)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to grant credits: ${error.message}`);
    }
    if (data) {
      return data as UserCreditState;
    }
  }
  throw new Error("Failed to grant credits — contention exceeded retry limit");
}
