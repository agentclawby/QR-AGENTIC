import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminAccessError,
  recordAdminAudit,
  requireAdmin,
} from "@/lib/admin";

const suspendSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(280).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await requireAdmin(admin, { user });

    const body = suspendSchema.parse(await request.json());

    if (user!.id === targetUserId && body.suspended) {
      return NextResponse.json(
        { error: "You cannot suspend yourself." },
        { status: 400 },
      );
    }

    const updates = body.suspended
      ? {
          suspended_at: new Date().toISOString(),
          suspended_reason: body.reason ?? "Suspended by operator",
        }
      : { suspended_at: null, suspended_reason: null };

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId)
      .select("id, suspended_at, suspended_reason")
      .single();

    if (error) throw error;

    await recordAdminAudit(admin, {
      actorId: user!.id,
      targetUserId,
      action: body.suspended ? "user.suspend" : "user.unsuspend",
      payload: { reason: body.reason ?? null },
    });

    return NextResponse.json({ success: true, profile: data });
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
    console.error("admin/users/[id]/suspend error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update suspension",
      },
      { status: 500 },
    );
  }
}
