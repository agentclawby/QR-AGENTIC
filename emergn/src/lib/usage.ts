import type { SupabaseClient } from "@supabase/supabase-js";

// Per-user daily usage tracker that backs cost ceilings + the admin cost
// dashboard. Each kind below maps to one column in user_usage_daily.
export type UsageKind = "x_calls" | "anthropic_tokens" | "consults" | "trainings";

interface UsageCaps {
  x_calls: number;
  anthropic_tokens: number;
  consults: number;
  trainings: number;
}

function envCount(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

export function getDefaultCaps(): UsageCaps {
  return {
    x_calls: envCount("MAX_X_CALLS_PER_DAY", 5),
    anthropic_tokens: envCount("MAX_ANTHROPIC_TOKENS_PER_DAY", 50_000),
    consults: envCount("MAX_CONSULTS_PER_DAY", 20),
    trainings: envCount("MAX_TRAININGS_PER_DAY", 10),
  };
}

export class UsageLimitError extends Error {
  status = 429;
  constructor(
    public kind: UsageKind,
    public used: number,
    public limit: number,
  ) {
    super(
      `Daily ${kind.replace("_", " ")} cap reached (${used}/${limit}). Try again tomorrow.`,
    );
    this.name = "UsageLimitError";
  }
}

export class AccountSuspendedError extends Error {
  status = 403;
  constructor(public reason: string | null) {
    super(reason ?? "Account suspended.");
    this.name = "AccountSuspendedError";
  }
}

interface ProfileGate {
  suspended_at: string | null;
  suspended_reason: string | null;
  usage_quota_overrides: Record<string, number> | null;
}

async function readProfileGate(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileGate | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("suspended_at, suspended_reason, usage_quota_overrides")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("readProfileGate failed", error.message);
    return null;
  }
  return (data as ProfileGate | null) ?? null;
}

export async function assertNotSuspended(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const profile = await readProfileGate(supabase, userId);
  if (profile?.suspended_at) {
    throw new AccountSuspendedError(profile.suspended_reason);
  }
}

function resolveCap(
  kind: UsageKind,
  defaults: UsageCaps,
  overrides: Record<string, number> | null,
): number {
  const candidate = overrides?.[kind];
  if (typeof candidate === "number" && candidate >= 0) return Math.floor(candidate);
  return defaults[kind];
}

async function readToday(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<UsageKind, number>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("user_usage_daily")
    .select("x_calls, anthropic_tokens, consults, trainings")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  return {
    x_calls: data?.x_calls ?? 0,
    anthropic_tokens: data?.anthropic_tokens ?? 0,
    consults: data?.consults ?? 0,
    trainings: data?.trainings ?? 0,
  };
}

export async function assertUsageWithinLimit(
  supabase: SupabaseClient,
  userId: string,
  kind: UsageKind,
  pendingAmount = 1,
): Promise<void> {
  const profile = await readProfileGate(supabase, userId);
  if (profile?.suspended_at) {
    throw new AccountSuspendedError(profile.suspended_reason);
  }

  const caps = getDefaultCaps();
  const limit = resolveCap(kind, caps, profile?.usage_quota_overrides ?? null);
  if (limit === 0) {
    throw new UsageLimitError(kind, 0, 0);
  }

  const today = await readToday(supabase, userId);
  if (today[kind] + pendingAmount > limit) {
    throw new UsageLimitError(kind, today[kind], limit);
  }
}

// Upserts today's row with `+amount`. Safe to call after the operation
// succeeds; failures log but don't throw so the user-facing action still
// succeeds (cost slippage logged for operator review).
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  kind: UsageKind,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("user_usage_daily")
    .select("x_calls, anthropic_tokens, consults, trainings")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  if (!existing) {
    const insert: Record<string, unknown> = {
      user_id: userId,
      day: today,
      x_calls: 0,
      anthropic_tokens: 0,
      consults: 0,
      trainings: 0,
    };
    insert[kind] = amount;
    const { error } = await supabase
      .from("user_usage_daily")
      .upsert(insert, { onConflict: "user_id,day" });
    if (error) console.error("recordUsage insert failed", error.message);
    return;
  }

  const next = (existing[kind] ?? 0) + amount;
  const { error } = await supabase
    .from("user_usage_daily")
    .update({ [kind]: next })
    .eq("user_id", userId)
    .eq("day", today);
  if (error) console.error("recordUsage update failed", error.message);
}

// Aggregates today + last 7 days for the admin cost dashboard.
export interface UsageSummary {
  today: Record<UsageKind, number>;
  last7: Record<UsageKind, number>;
  topUsers: Array<{
    user_id: string;
    anthropic_tokens: number;
    x_calls: number;
    trainings: number;
    consults: number;
  }>;
}

export async function getUsageSummary(
  supabase: SupabaseClient,
): Promise<UsageSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: rows } = await supabase
    .from("user_usage_daily")
    .select("user_id, day, x_calls, anthropic_tokens, consults, trainings")
    .gte("day", sevenAgo)
    .order("day", { ascending: false })
    .limit(2000);

  const empty: Record<UsageKind, number> = {
    x_calls: 0,
    anthropic_tokens: 0,
    consults: 0,
    trainings: 0,
  };

  const todays: Record<UsageKind, number> = { ...empty };
  const last7: Record<UsageKind, number> = { ...empty };
  const perUser = new Map<string, Record<UsageKind, number>>();

  for (const row of rows ?? []) {
    last7.x_calls += row.x_calls ?? 0;
    last7.anthropic_tokens += row.anthropic_tokens ?? 0;
    last7.consults += row.consults ?? 0;
    last7.trainings += row.trainings ?? 0;
    if (row.day === today) {
      todays.x_calls += row.x_calls ?? 0;
      todays.anthropic_tokens += row.anthropic_tokens ?? 0;
      todays.consults += row.consults ?? 0;
      todays.trainings += row.trainings ?? 0;
    }
    const acc = perUser.get(row.user_id) ?? { ...empty };
    acc.x_calls += row.x_calls ?? 0;
    acc.anthropic_tokens += row.anthropic_tokens ?? 0;
    acc.consults += row.consults ?? 0;
    acc.trainings += row.trainings ?? 0;
    perUser.set(row.user_id, acc);
  }

  const topUsers = Array.from(perUser.entries())
    .map(([user_id, totals]) => ({ user_id, ...totals }))
    .sort((a, b) => b.anthropic_tokens - a.anthropic_tokens)
    .slice(0, 10);

  return { today: todays, last7, topUsers };
}
