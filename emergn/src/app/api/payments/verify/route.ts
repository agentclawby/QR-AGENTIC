import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import { verifySplPayment } from "@/lib/solana/verify-payment";
import { ensureUserCreditBalance, updateUserCredits } from "@/lib/credits";
import {
  CREDIT_PACKS,
  getCreditPackAmountBaseUnits,
  type CreditPackId,
} from "@/lib/payments/config";

const paymentSchema = z.object({
  action: z.enum(["prepare", "confirm"]).optional().default("confirm"),
  signature: z.string().trim().min(20),
  packId: z.enum(["starter", "pro", "whale"]),
  agentId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = paymentSchema.parse(await request.json());
    const [{ data: existing }, { data: profile }] = await Promise.all([
      admin
        .from("payments")
        .select("*")
        .eq("tx_signature", body.signature)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single(),
    ]);

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "This transaction has already been used" },
        { status: 409 }
      );
    }

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "A linked wallet is required to verify payments" },
        { status: 400 }
      );
    }

    const capabilities = getSystemCapabilities({
      walletAddress: profile.wallet_address,
    });
    if (!capabilities.payments.enabled) {
      return NextResponse.json(
        { error: capabilities.payments.reason },
        { status: 503 }
      );
    }

    const treasuryWallet = process.env.EMERGN_TREASURY_WALLET!;
    const emrgMint = process.env.EMRG_TOKEN_MINT!;
    const pack = CREDIT_PACKS[body.packId as CreditPackId];
    const existingPackId =
      existing &&
      typeof existing.metadata === "object" &&
      existing.metadata !== null &&
      "pack_id" in existing.metadata &&
      typeof existing.metadata.pack_id === "string"
        ? existing.metadata.pack_id
        : null;

    if (existingPackId && existingPackId !== body.packId) {
      return NextResponse.json(
        { error: "This payment signature is already tied to a different credit pack" },
        { status: 409 }
      );
    }

    const paymentMetadata = {
      pack_id: pack.id,
      premium_credits: pack.premiumCredits,
      training_credits: pack.trainingCredits,
    };

    let payment = existing;
    if (!payment) {
      const { data: created, error: createError } = await admin
        .from("payments")
        .insert({
          user_id: user.id,
          agent_id: body.agentId ?? null,
          payment_type: "credit_topup",
          token_mint: emrgMint,
          amount: getCreditPackAmountBaseUnits(body.packId).toString(),
          tx_signature: body.signature,
          metadata: paymentMetadata,
          status: "pending",
        })
        .select("*")
        .single();

      if (createError || !created) {
        return NextResponse.json(
          { error: "Failed to register payment attempt" },
          { status: 500 }
        );
      }

      payment = created;
    }

    if (body.action === "prepare") {
      return NextResponse.json({
        success: true,
        payment,
      });
    }

    if (payment.status === "confirmed") {
      const credits = await ensureUserCreditBalance(admin, user.id);

      return NextResponse.json({
        success: true,
        duplicate: true,
        credits,
        payment,
      });
    }

    let verification;

    try {
      verification = await verifySplPayment({
        signature: body.signature,
        expectedMint: emrgMint,
        treasuryOwner: treasuryWallet,
        senderOwner: profile.wallet_address,
        expectedAmount: getCreditPackAmountBaseUnits(body.packId),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify payment";
      const isRecoverable = message.includes("not confirmed");

      await admin
        .from("payments")
        .update({
          status: isRecoverable ? "pending" : "failed",
          metadata: {
            ...(payment.metadata ?? {}),
            ...paymentMetadata,
            last_error: message,
            recovery_needed: !isRecoverable,
            last_checked_at: new Date().toISOString(),
          },
        })
        .eq("id", payment.id);

      return NextResponse.json(
        {
          error: isRecoverable
            ? "Transfer submitted but not fully confirmed yet. Retry verification in a moment."
            : message,
        },
        { status: isRecoverable ? 409 : 400 }
      );
    }

    const verifiedMetadata = {
      ...(payment.metadata ?? {}),
      ...paymentMetadata,
      last_error: null,
      recovery_needed: false,
      verified_at: new Date().toISOString(),
      verification_slot: verification.slot,
    };

    const { error: confirmError } = await admin
      .from("payments")
      .update({
        amount: verification.amount.toString(),
        token_mint: emrgMint,
        status: "confirmed",
        metadata: verifiedMetadata,
      })
      .eq("id", payment.id);

    if (confirmError) {
      return NextResponse.json(
        { error: "Payment verified on-chain but could not be finalized" },
        { status: 500 }
      );
    }

    let credits = await ensureUserCreditBalance(admin, user.id);

    try {
      credits = await updateUserCredits(admin, user.id, {
        premium_credits: credits.premium_credits + pack.premiumCredits,
        training_credits: credits.training_credits + pack.trainingCredits,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply credits";

      await admin
        .from("payments")
        .update({
          status: "failed",
          metadata: {
            ...verifiedMetadata,
            last_error: message,
            recovery_needed: true,
            credit_recovery_required: true,
          },
        })
        .eq("id", payment.id);

      return NextResponse.json(
        {
          error:
            "Payment reached the treasury, but credits could not be applied automatically. The payment was flagged for recovery.",
        },
        { status: 500 }
      );
    }

    await admin
      .from("payments")
      .update({
        metadata: {
          ...verifiedMetadata,
          credits_applied_at: new Date().toISOString(),
          credit_recovery_required: false,
        },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      success: true,
      credits,
      verification,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
