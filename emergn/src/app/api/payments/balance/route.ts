import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  buildUnavailableCreditBalance,
  ensureUserCreditBalance,
} from "@/lib/credits";
import { ensureUserProfile } from "@/lib/profile";

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

    let setupWarning: string | null = null;
    try {
      // Self-heal: some users (e.g. SIWS-created via admin.createUser) don't get
      // a profile row from the on_auth_user_created trigger. Create it lazily so
      // the user_credit_balances FK insert below doesn't violate.
      await ensureUserProfile(admin, user);
    } catch (error) {
      setupWarning =
        error instanceof Error ? error.message : "Failed to ensure profile";
      console.error("Payment profile setup warning:", error);
    }

    const [{ data: profile }, creditsResult] = await Promise.all([
      admin
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .maybeSingle(),
      ensureUserCreditBalance(admin, user.id)
        .then((credits) => ({ credits, error: null as string | null }))
        .catch((error) => ({
          credits: buildUnavailableCreditBalance(user.id),
          error:
            error instanceof Error
              ? error.message
              : "Failed to initialize credit balance",
        })),
    ]);

    const capabilities = getSystemCapabilities({
      walletAddress: profile?.wallet_address ?? null,
    });
    const creditWarning = creditsResult.error ?? setupWarning;

    return NextResponse.json({
      success: true,
      credits: creditsResult.credits,
      packs: [],
      paymentConfig: null,
      paymentCapability: capabilities.payments,
      linkedWalletAddress: profile?.wallet_address ?? null,
      creditsAvailable: !creditWarning,
      creditWarning,
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
