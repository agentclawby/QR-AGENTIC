import { NextResponse } from "next/server";

/**
 * Defense-in-depth for admin routes. Session auth already prevents
 * unauthorized access, but an attacker who tricks an admin's browser into
 * making a same-site request from a different origin would otherwise succeed.
 *
 * Validates that the request's Origin (or Referer fallback) matches our
 * canonical site URL. Returns null when valid, or a 403 response when not.
 *
 * NEXT_PUBLIC_SITE_URL is the source of truth. Local dev (localhost) and
 * Vercel preview URLs are explicitly allowlisted.
 */
export function enforceAdminOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = origin ?? (referer ? new URL(referer).origin : null);

  if (!source) {
    // No Origin header (e.g. server-to-server, curl). For admin routes we
    // require it.
    return NextResponse.json(
      { error: "Origin header required", code: "forbidden" },
      { status: 403 },
    );
  }

  const expected = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const allowed = new Set<string>();
  if (expected) allowed.add(expected);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://localhost:3010");
    allowed.add("http://127.0.0.1:3000");
    allowed.add("http://127.0.0.1:3010");
  }

  // Vercel preview deployments use predictable subdomains under vercel.app.
  // Match by suffix so admins can use preview URLs without manual config.
  const isVercelPreview = /\.vercel\.app$/.test(new URL(source).hostname);

  if (allowed.has(source) || isVercelPreview) {
    return null;
  }

  return NextResponse.json(
    { error: "Origin not allowed", code: "forbidden" },
    { status: 403 },
  );
}
