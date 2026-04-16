import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemCapabilities } from "@/lib/config/features";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile: {
      wallet_address: string | null;
      x_handle: string | null;
    } | null = null;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_address, x_handle")
        .eq("id", user.id)
        .maybeSingle();

      profile = data;
    }

    return NextResponse.json({
      success: true,
      capabilities: getSystemCapabilities({
        walletAddress: profile?.wallet_address ?? null,
      }),
      linkedAccounts: {
        walletAddress: profile?.wallet_address ?? null,
        xHandle: profile?.x_handle ?? null,
      },
    });
  } catch (error) {
    console.error("System capabilities error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load system capabilities",
      },
      { status: 500 }
    );
  }
}
