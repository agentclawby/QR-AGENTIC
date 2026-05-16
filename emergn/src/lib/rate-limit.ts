import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitKey =
  | "consult"
  | "content"
  | "portfolio"
  | "train"
  | "x_ingest";

interface Window {
  max: number;
  windowMs: number;
}

interface RateLimitConfig {
  hourly: Window;
  daily: Window;
}

export class RateLimitedError extends Error {
  readonly key: RateLimitKey;
  readonly retryAfterSeconds: number;
  readonly window: "hourly" | "daily";

  constructor(
    key: RateLimitKey,
    retryAfterSeconds: number,
    window: "hourly" | "daily"
  ) {
    super(`Rate limit exceeded for ${key} (${window})`);
    this.name = "RateLimitedError";
    this.key = key;
    this.retryAfterSeconds = retryAfterSeconds;
    this.window = window;
  }
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// V1 operator-paid mode: hourly caps prevent burst abuse, daily caps bound
// per-user worst-case spend to ~$3/day. Adjust here when real usage data
// arrives — every route already calls checkUserRateLimit() so changes are
// purely declarative.
export const RATE_LIMITS: Record<RateLimitKey, RateLimitConfig> = {
  consult: {
    hourly: { max: 20, windowMs: HOUR_MS },
    daily: { max: 50, windowMs: DAY_MS },
  },
  content: {
    hourly: { max: 30, windowMs: HOUR_MS },
    daily: { max: 50, windowMs: DAY_MS },
  },
  portfolio: {
    hourly: { max: 6, windowMs: HOUR_MS },
    daily: { max: 10, windowMs: DAY_MS },
  },
  train: {
    hourly: { max: 10, windowMs: HOUR_MS },
    daily: { max: 5, windowMs: DAY_MS },
  },
  x_ingest: {
    hourly: { max: 5, windowMs: HOUR_MS },
    daily: { max: 10, windowMs: DAY_MS },
  },
};

async function countSince(
  admin: SupabaseClient,
  userId: string,
  key: RateLimitKey,
  windowMs: number
) {
  const since = new Date(Date.now() - windowMs).toISOString();
  return admin
    .from("agent_interactions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .contains("metadata", { user_id: userId, rate_key: key });
}

/**
 * Throws RateLimitedError if the user has exceeded either the hourly or daily
 * cap for the key. Backed by `agent_interactions.metadata` — each
 * rate-limited route writes `{ user_id, rate_key }` into the interaction it
 * logs after a successful call.
 */
export async function checkUserRateLimit(
  admin: SupabaseClient,
  userId: string,
  key: RateLimitKey
) {
  const config = RATE_LIMITS[key];

  const [hourly, daily] = await Promise.all([
    countSince(admin, userId, key, config.hourly.windowMs),
    countSince(admin, userId, key, config.daily.windowMs),
  ]);

  if (hourly.error || daily.error) {
    // Fail-open on observability errors so a missing index doesn't lock real
    // users out. Logged for ops review.
    console.error("rate-limit check failed", {
      key,
      hourlyError: hourly.error,
      dailyError: daily.error,
    });
    return;
  }

  const hourlyCount = hourly.count ?? 0;
  const dailyCount = daily.count ?? 0;

  if (dailyCount >= config.daily.max) {
    throw new RateLimitedError(
      key,
      Math.ceil(config.daily.windowMs / 1000),
      "daily"
    );
  }
  if (hourlyCount >= config.hourly.max) {
    throw new RateLimitedError(
      key,
      Math.ceil(config.hourly.windowMs / 1000),
      "hourly"
    );
  }
}

/** Convenience for routes: returns the metadata object to merge in. */
export function rateLimitMetadata(userId: string, key: RateLimitKey) {
  return { user_id: userId, rate_key: key };
}
