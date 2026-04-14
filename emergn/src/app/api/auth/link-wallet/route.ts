import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { publicKey, signature, message } = await request.json();

    // Verify signature
    const publicKeyBytes = bs58.decode(publicKey);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = bs58.decode(message);

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

    // Update profile with wallet address
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: publicKey })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to link wallet" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link wallet error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
