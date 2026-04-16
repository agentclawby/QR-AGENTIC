import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_FREE_CONSULTS = 3;

export interface UserCreditState {
  id: string;
  user_id: string;
  free_consults_remaining: number;
  free_consults_reset_at: string;
  premium_credits: number;
  training_credits: number;
}

export async function ensureUserCreditBalance(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: existing } = await supabase
    .from("user_credit_balances")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    const { data: created, error } = await supabase
      .from("user_credit_balances")
      .insert({
        user_id: userId,
        free_consults_remaining: DEFAULT_FREE_CONSULTS,
      })
      .select("*")
      .single();

    if (error || !created) {
      throw new Error("Failed to initialize user credit balance");
    }

    return created as UserCreditState;
  }

  const resetAt = new Date(existing.free_consults_reset_at).getTime();
  if (Number.isNaN(resetAt) || Date.now() < resetAt) {
    return existing as UserCreditState;
  }

  const nextReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: resetRow, error: resetError } = await supabase
    .from("user_credit_balances")
    .update({
      free_consults_remaining: DEFAULT_FREE_CONSULTS,
      free_consults_reset_at: nextReset,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (resetError || !resetRow) {
    throw new Error("Failed to reset daily free consultations");
  }

  return resetRow as UserCreditState;
}

export async function updateUserCredits(
  supabase: SupabaseClient,
  userId: string,
  changes: Partial<
    Pick<
      UserCreditState,
      "free_consults_remaining" | "free_consults_reset_at" | "premium_credits" | "training_credits"
    >
  >
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
