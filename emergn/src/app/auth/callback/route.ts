import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProfileFromAuth } from "@/lib/profile";
import { upsertXPostToken } from "@/lib/x/tokens";
import type { EmailOtpType } from "@supabase/supabase-js";

async function syncProfileSafe(): Promise<{ error?: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  try {
    const admin = createAdminClient();
    await syncProfileFromAuth(admin, user);
  } catch (error) {
    const code = (error as Error & { code?: string }).code;
    if (code === "x_handle_already_linked") {
      return { error: "x_handle_already_linked" };
    }
    console.error("[auth/callback] profile sync warning", error);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Only accept same-origin paths. Reject `//evil.com`, `https://...`, etc.
  const rawNext = searchParams.get("next") ?? "/app";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  const supabase = await createClient();
  let lastError: string | null = null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[auth/callback] verifyOtp success", { type });
      }
      const syncResult = await syncProfileSafe();
      if (syncResult?.error === "x_handle_already_linked") {
        const conflictUrl = new URL(`${origin}/login`);
        conflictUrl.searchParams.set("error", "x_handle_already_linked");
        return NextResponse.redirect(conflictUrl.toString());
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    lastError = error.message;
    console.error("[auth/callback] verifyOtp failed:", error.message);
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const syncResult = await syncProfileSafe();
      if (syncResult?.error === "x_handle_already_linked") {
        const conflictUrl = new URL(`${origin}/login`);
        conflictUrl.searchParams.set("error", "x_handle_already_linked");
        return NextResponse.redirect(conflictUrl.toString());
      }

      // Capture X OAuth provider tokens so the agent can post on the user's
      // behalf. Tokens are short-lived; refresh logic lives in lib/x/tokens.
      const session = data.session;
      const userId = data.user?.id;
      const xIdentity = data.user?.identities?.find(
        (i) => i.provider === "x" || i.provider === "twitter"
      );
      if (
        userId &&
        session?.provider_token &&
        (xIdentity || data.user?.app_metadata?.provider === "twitter" || data.user?.app_metadata?.provider === "x")
      ) {
        try {
          const admin = createAdminClient();
          await upsertXPostToken(admin, {
            userId,
            accessToken: session.provider_token,
            refreshToken: session.provider_refresh_token ?? null,
            xUserId: xIdentity?.identity_data?.provider_id ?? null,
            xHandle:
              (xIdentity?.identity_data?.user_name as string | undefined) ??
              (xIdentity?.identity_data?.preferred_username as string | undefined) ??
              null,
          });
        } catch (err) {
          console.warn(
            "[auth/callback] failed to capture X post token:",
            err instanceof Error ? err.message : err
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    lastError = error.message;
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  const failureUrl = new URL(`${origin}/login`);
  failureUrl.searchParams.set("error", "auth_failed");
  if (lastError) {
    failureUrl.searchParams.set("msg", lastError.slice(0, 200));
  }
  return NextResponse.redirect(failureUrl.toString());
}
