import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeGetUser } from "./safe-auth";

// Routes that genuinely require authentication. Everything else under /app
// (dashboard, cortex, leaderboard, agent profile, tokens) is browseable by
// anonymous visitors — they only hit a login wall when they try to act.
const GATED_PREFIXES = ["/app/forge", "/app/settings", "/app/admin"] as const;

function requiresAuth(pathname: string) {
  return GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip Supabase auth if env vars aren't configured yet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (requiresAuth(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // safeGetUser wraps supabase.auth.getUser() with a 2.5s timeout + process-
  // level circuit breaker. Without this, a dead Supabase URL causes every
  // page load to hang ~25-30s waiting on supabase-js's internal retry loop.
  const { user, state } = await safeGetUser(supabase);

  if (process.env.NODE_ENV !== "production" && state !== "live") {
    console.warn(
      `[middleware] auth ${state} for ${request.nextUrl.pathname} — treating as unauthenticated`
    );
  }

  // Gated routes: redirect unauthenticated traffic to /login with `next` so
  // post-login we return to the originally requested page.
  if (!user && requiresAuth(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users on /login → straight to /app (or wherever ?next= says).
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    const rawNext = request.nextUrl.searchParams.get("next");
    const next =
      rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
        ? rawNext
        : "/app";
    url.pathname = next;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
