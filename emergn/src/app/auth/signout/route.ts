import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isMissingSessionError(error: { message?: string } | null) {
  return /auth session missing|session.*missing/i.test(error?.message ?? "");
}

function wantsJson(request: NextRequest) {
  return (
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "fetch"
  );
}

async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error && !isMissingSessionError(error)) {
    console.error("[auth/signout] failed:", error.message);
    return error.message;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const error = await signOut();
  const json = wantsJson(request);

  if (error) {
    if (json) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=signout_failed";
    return NextResponse.redirect(url, 303);
  }

  if (json) {
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url, 303);
}

export async function GET(request: NextRequest) {
  const error = await signOut();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = error ? "?error=signout_failed" : "";

  return NextResponse.redirect(url, 303);
}
