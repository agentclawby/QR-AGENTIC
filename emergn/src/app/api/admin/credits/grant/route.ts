import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminAccessError,
  recordAdminAudit,
  requireAdmin,
} from "@/lib/admin";
import {
  ensureUserCreditBalance,
  grantActionCredits,
  MAX_ACTION_CREDITS,
} from "@/lib/credits";

const grantSchema = z.object({
  user_id: z.string().uuid(),
  // Single-pool model: every grant tops up `action_credits`. The legacy
  // `training`/`premium`/`free_consults_reset` types are accepted for
  // backwards compat but all route through grantActionCredits now.
  type: z
    .enum(["action", "training", "premium", "free_consults_reset"])
    .default("action"),
  amount: z.number().int().min(0).max(MAX_ACTION_CREDITS).optional(),
  note: z.string().trim().max(280).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await requireAdmin(admin, { user });

    const body = grantSchema.parse(await request.json());

    if (body.type === "free_consults_reset") {
      // Legacy escape hatch — refresh free_consults to default 5.
      const current = await ensureUserCreditBalance(admin, body.user_id);
      const reset = new Date().toISOString();
      const { error } = await admin
        .from("user_credit_balances")
        .update({
          free_consults_remaining: 5,
          free_consults_reset_at: reset,
        })
        .eq("user_id", body.user_id);
      if (error) throw error;
      await recordAdminAudit(admin, {
        actorId: user!.id,
        targetUserId: body.user_id,
        action: "credits.free_consults_reset",
        payload: { previous: current.free_consults_remaining },
      });
      return NextResponse.json({ success: true });
    }

    const amount = body.amount ?? 0;
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive." },
        { status: 400 },
      );
    }

    const updated = await grantActionCredits(admin, body.user_id, amount);

    await recordAdminAudit(admin, {
      actorId: user!.id,
      targetUserId: body.user_id,
      action: "credits.grant",
      payload: {
        type: body.type,
        amount,
        new_balance: updated.action_credits,
        note: body.note ?? null,
      },
    });

    return NextResponse.json({ success: true, credits: updated });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("admin/credits/grant error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to grant credits",
      },
      { status: 500 },
    );
  }
}
