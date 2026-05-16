import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SOLANA_AUTH_NONCE_COOKIE,
  verifySolanaAuthMessage,
} from "@/lib/auth/solana-auth";

function withClearedNonce(response: NextResponse) {
  response.cookies.set(SOLANA_AUTH_NONCE_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}

function jsonWithClearedNonce(
  body: Record<string, unknown>,
  init?: ResponseInit
) {
  return withClearedNonce(NextResponse.json(body, init));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonWithClearedNonce({ error: "Not authenticated" }, { status: 401 });
    }

    const { publicKey, signature, message, nonce } = await request.json();

    if (!publicKey || !signature || !message || !nonce) {
      return jsonWithClearedNonce(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expectedNonce = request.cookies.get(SOLANA_AUTH_NONCE_COOKIE)?.value;
    if (nonce !== expectedNonce) {
      return jsonWithClearedNonce(
        { error: "Missing or expired nonce. Please request a new signature." },
        { status: 401 }
      );
    }

    const verification = verifySolanaAuthMessage({
      publicKey,
      signature,
      message,
      expectedNonce,
      expectedIntent: "link-wallet",
      expectedUserId: user.id,
      request,
    });

    if (!verification.valid) {
      return jsonWithClearedNonce(
        { error: verification.error ?? "Invalid signature" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    const { data: existingWalletProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("wallet_address", publicKey)
      .neq("id", user.id)
      .maybeSingle();

    if (existingWalletProfile) {
      return jsonWithClearedNonce(
        { error: "This wallet is already linked to another account" },
        { status: 409 }
      );
    }

    // Use the service-role admin client so the profiles_protect_wallet trigger
    // (which blocks client-side wallet_address updates) lets the write through.
    const { error } = await admin
      .from("profiles")
      .update({ wallet_address: publicKey })
      .eq("id", user.id);

    if (error) {
      const pg = error as { code?: string; message?: string };
      // Surface unique-violation race cleanly.
      if (pg.code === "23505") {
        return jsonWithClearedNonce(
          { error: "This wallet is already linked to another account" },
          { status: 409 }
        );
      }
      // 23514 is a check_violation. The wallet-write trigger from migration
      // 005 raises this when it (incorrectly) thinks a non-service-role is
      // updating wallet_address. Surface a clear message pointing at the
      // migration so a server admin can diagnose without grepping logs.
      if (pg.code === "23514") {
        console.error("link-wallet: blocked by wallet-write trigger", error);
        return jsonWithClearedNonce(
          {
            error:
              "Wallet write is blocked by a database trigger. Apply migration 013_wallet_trigger_use_auth_role.sql in Supabase SQL Editor.",
          },
          { status: 500 }
        );
      }
      console.error("link-wallet: profile update failed", error);
      const dev = process.env.NODE_ENV !== "production";
      return jsonWithClearedNonce(
        {
          error: dev
            ? `Failed to link wallet — ${pg.code ?? "no code"}: ${pg.message ?? "no message"}`
            : "Failed to link wallet",
        },
        { status: 500 }
      );
    }

    return withClearedNonce(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Link wallet error:", error);
    return jsonWithClearedNonce(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
