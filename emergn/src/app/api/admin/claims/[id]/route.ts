import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminAccessError,
  recordAdminAudit,
  requireAdmin,
} from "@/lib/admin";
import { enforceAdminOrigin } from "@/lib/api/admin-guard";
import { awardActionCredits, EarnCapReachedError } from "@/lib/credits";

const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(280).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originDenied = enforceAdminOrigin(request);
  if (originDenied) return originDenied;

  try {
    const { id: claimId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await requireAdmin(admin, { user });

    const body = decisionSchema.parse(await request.json());

    const { data: claim, error: readError } = await admin
      .from("credit_claims")
      .select("*")
      .eq("id", claimId)
      .single();

    if (readError || !claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }

    if (claim.status !== "manual_review") {
      return NextResponse.json(
        { error: `Claim is already ${claim.status}.` },
        { status: 409 },
      );
    }

    const { data, error } = await admin
      .from("credit_claims")
      .update({ status: body.status, reason: body.reason ?? null })
      .eq("id", claimId)
      .select("*")
      .single();

    if (error || !data) throw error ?? new Error("Failed to update claim.");

    let awarded = false;
    if (body.status === "approved") {
      try {
        await awardActionCredits(admin, claim.user_id, 1);
        awarded = true;
      } catch (error) {
        if (error instanceof EarnCapReachedError) {
          await admin
            .from("credit_claims")
            .update({
              status: "rejected",
              reason: "User hit daily earn cap before approval.",
            })
            .eq("id", claim.id);
          return NextResponse.json({ error: error.message }, { status: 429 });
        }
        throw error;
      }
    }

    await recordAdminAudit(admin, {
      actorId: user!.id,
      targetUserId: claim.user_id,
      action: `claim.${body.status}`,
      payload: { claim_id: claim.id, awarded, reason: body.reason ?? null },
    });

    return NextResponse.json({ success: true, claim: data, awarded });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }
    console.error("admin/claims/[id] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update claim",
      },
      { status: 500 },
    );
  }
}
