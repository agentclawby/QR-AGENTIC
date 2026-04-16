import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import { ensureUserCreditBalance } from "@/lib/credits";
import { CREDIT_PACKS } from "@/lib/payments/config";

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [credits, { data: profile }] = await Promise.all([
      ensureUserCreditBalance(admin, user.id),
      supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single(),
    ]);

    const capabilities = getSystemCapabilities({
      walletAddress: profile?.wallet_address ?? null,
    });

    return NextResponse.json({
      success: true,
      credits,
      packs: Object.values(CREDIT_PACKS),
      paymentConfig: {
        emrgMint:
          process.env.NEXT_PUBLIC_EMRG_TOKEN_MINT ??
          process.env.EMRG_TOKEN_MINT ??
          null,
        treasuryWallet:
          process.env.NEXT_PUBLIC_EMERGN_TREASURY_WALLET ??
          process.env.EMERGN_TREASURY_WALLET ??
          null,
        tokenDecimals: Number(process.env.EMRG_TOKEN_DECIMALS ?? "6"),
      },
      paymentCapability: capabilities.payments,
      linkedWalletAddress: profile?.wallet_address ?? null,
    });
  } catch (error) {
    console.error("Payment balance error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch credit balance",
      },
      { status: 500 }
    );
  }
}
