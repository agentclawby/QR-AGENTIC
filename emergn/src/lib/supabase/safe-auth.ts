// Hardened wrapper around `supabase.auth.getUser()` that prevents request
// hangs when Supabase Auth is unreachable (paused project, broken DNS,
// network partition).
//
// supabase-js retries `_callRefreshToken` with exponential backoff on any
// network-class failure, which takes ~25-30s before giving up. Every page
// load runs middleware → getUser → that retry sequence, so a dead Supabase
// URL turns every dev navigation into a 30-second stall.
//
// Two layered guards:
//   1) Per-call timeout — bounds the worst case to AUTH_TIMEOUT_MS.
//   2) Process-level circuit breaker — once one call trips, subsequent calls
//      short-circuit for COOLDOWN_MS so we don't burn the timeout budget on
//      every request. State is per-Node-process so it survives across
//      requests in `next dev` and across warm serverless invocations.

import type { SupabaseClient, User } from "@supabase/supabase-js";

const AUTH_TIMEOUT_MS = 2_500;
const COOLDOWN_MS = 60_000;

let lastFailureAt = 0;
let warnedOnceThisCooldown = false;

function isCircuitOpen() {
  return Date.now() - lastFailureAt < COOLDOWN_MS;
}

function tripCircuit(reason: string) {
  lastFailureAt = Date.now();
  if (!warnedOnceThisCooldown && process.env.NODE_ENV !== "production") {
    warnedOnceThisCooldown = true;
    console.warn(
      `[supabase/safe-auth] auth circuit opened (${reason}). Pages will treat ` +
        `requests as unauthenticated for the next ${COOLDOWN_MS / 1000}s. ` +
        `Most likely cause: NEXT_PUBLIC_SUPABASE_URL is unreachable. ` +
        `Check the Supabase project status.`
    );
    setTimeout(() => {
      warnedOnceThisCooldown = false;
    }, COOLDOWN_MS);
  }
}

export type SafeAuthState = "live" | "circuit-open" | "timeout" | "error";

export interface SafeGetUserResult {
  user: User | null;
  state: SafeAuthState;
}

export async function safeGetUser(
  supabase: SupabaseClient
): Promise<SafeGetUserResult> {
  if (isCircuitOpen()) {
    return { user: null, state: "circuit-open" };
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<{ kind: "timeout" }>((resolve) => {
    timer = setTimeout(() => resolve({ kind: "timeout" }), AUTH_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      supabase.auth
        .getUser()
        .then((res) => ({ kind: "ok" as const, res })),
      timeoutPromise,
    ]);

    if (timer) clearTimeout(timer);

    if (result.kind === "timeout") {
      tripCircuit("getUser timed out");
      return { user: null, state: "timeout" };
    }

    return { user: result.res.data.user ?? null, state: "live" };
  } catch (err) {
    if (timer) clearTimeout(timer);
    const message = err instanceof Error ? err.message : "unknown";
    tripCircuit(message);
    return { user: null, state: "error" };
  }
}

// For diagnostics — used by middleware to log a single line per failure mode
// rather than dumping the full supabase-js retry stack.
export function getCircuitState() {
  return {
    open: isCircuitOpen(),
    lastFailureAt: lastFailureAt || null,
    cooldownRemainingMs: isCircuitOpen()
      ? COOLDOWN_MS - (Date.now() - lastFailureAt)
      : 0,
  };
}
