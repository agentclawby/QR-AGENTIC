import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "rate_limited"
  | "insufficient_credits"
  | "suspended"
  | "service_unavailable"
  | "conflict"
  | "internal_error";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 400,
  rate_limited: 429,
  insufficient_credits: 402,
  suspended: 403,
  service_unavailable: 503,
  conflict: 409,
  internal_error: 500,
};

/**
 * Standardized API error envelope. Every route should return errors via this
 * helper so a) clients can switch on `code` reliably and b) info-disclosure
 * audits have a single place to check what gets surfaced to users.
 *
 * `message` is the user-facing string. `internal` is server-side only — it is
 * logged but never returned to the client.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  options?: {
    status?: number;
    headers?: HeadersInit;
    internal?: unknown;
  },
): NextResponse {
  if (options?.internal && process.env.NODE_ENV !== "test") {
    console.error(`[api:${code}]`, options.internal);
  }

  return NextResponse.json(
    { error: message, code },
    {
      status: options?.status ?? STATUS_BY_CODE[code],
      headers: options?.headers,
    },
  );
}
