import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nacl from "tweetnacl";
import bs58 from "bs58";

// Use service role client for admin operations (creating users, signing JWTs)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { publicKey, signature, message, nonce } = await request.json();

    if (!publicKey || !signature || !message || !nonce) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Decode from bs58
    const publicKeyBytes = bs58.decode(publicKey);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = bs58.decode(message);

    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Verify the message contains the correct wallet and nonce
    const messageText = new TextDecoder().decode(messageBytes);
    if (!messageText.includes(publicKey) || !messageText.includes(nonce)) {
      return NextResponse.json(
        { error: "Message verification failed" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getAdminClient();

    // Check if user already exists with this wallet
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) =>
        u.user_metadata?.wallet_address === publicKey ||
        u.email === `${publicKey}@wallet.emergn.xyz`
    );

    if (existingUser) {
      // User exists, proceed to generate session
    } else {
      // Create new user with wallet as identity
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: `${publicKey}@wallet.emergn.xyz`,
          email_confirm: true,
          user_metadata: {
            wallet_address: publicKey,
            provider: "solana",
          },
        });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

    }

    // Generate a magic link / session for the user
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: `${publicKey}@wallet.emergn.xyz`,
      });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: "Failed to generate session" },
        { status: 500 }
      );
    }

    // Extract the type from the action link
    const url = new URL(linkData.properties.action_link);
    const type = url.searchParams.get("type");

    return NextResponse.json({
      success: true,
      // Client will use this to verify the OTP and establish a session
      token_hash: linkData.properties.hashed_token,
      verification_url: `/auth/callback?token_hash=${linkData.properties.hashed_token}&type=${type}`,
    });
  } catch (error) {
    console.error("SIWS verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
