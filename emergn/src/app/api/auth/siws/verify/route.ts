import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SOLANA_AUTH_NONCE_COOKIE,
  isSupabaseExistingAccountError,
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

function getSafeAdminError(error: {
  message?: string;
  status?: number | string;
  code?: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return {
    message: error.message ?? "Unknown Supabase admin error",
    status: error.status ?? null,
    code: error.code ?? null,
  };
}

export async function POST(request: NextRequest) {
  try {
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
      expectedIntent: "sign-in",
      request,
    });

    if (!verification.valid) {
      return jsonWithClearedNonce(
        { error: verification.error ?? "Message verification failed" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const walletEmail = `${publicKey}@wallet.emergn.xyz`;

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: walletEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: publicKey,
        provider: "solana",
      },
    });

    if (createError && !isSupabaseExistingAccountError(createError)) {
      console.error("[siws/verify] wallet user creation failed", {
        status: createError.status,
        code: createError.code,
        message: createError.message,
      });

      return jsonWithClearedNonce(
        {
          error: "Failed to create wallet user",
          details: getSafeAdminError(createError),
        },
        { status: 500 }
      );
    }

    // Generate a magic link / session for the user
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: walletEmail,
      });

    if (linkError || !linkData) {
      if (linkError) {
        console.error("[siws/verify] wallet session link failed", {
          status: linkError.status,
          code: linkError.code,
          message: linkError.message,
        });
      }

      return jsonWithClearedNonce(
        {
          error: "Failed to generate session",
          details: linkError ? getSafeAdminError(linkError) : null,
        },
        { status: 500 }
      );
    }

    // Extract the type from the action link
    const url = new URL(linkData.properties.action_link);
    const type = url.searchParams.get("type");

    if (process.env.NODE_ENV !== "production") {
      console.info("[siws/verify] issued session link", {
        publicKey: publicKey.slice(0, 8),
        type,
      });
    }

    return withClearedNonce(NextResponse.json({
      success: true,
      // Client will use this to verify the OTP and establish a session
      token_hash: linkData.properties.hashed_token,
      verification_url: `/auth/callback?token_hash=${linkData.properties.hashed_token}&type=${type}`,
    }));
  } catch (error) {
    console.error("SIWS verify error:", error);
    return jsonWithClearedNonce(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
