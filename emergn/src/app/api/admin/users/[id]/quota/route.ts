import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminAccessError,
  recordAdminAudit,
  requireAdmin,
} from "@/lib/admin";

const quotaSchema = z.object({
  overrides: z
    .record(
      z.enum(["x_calls", "anthropic_tokens", "consults", "trainings"]),
      z.number().int().min(0).max(1_000_000),
    )
    .default({}),
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

    const body = quotaSchema.parse(await request.json());

    const { data, error } = await admin
      .from("profiles")
      .update({ usage_quota_overrides: body.overrides })
      .eq("id", targetUserId)
      .select("id, usage_quota_overrides")
      .single();

    if (error) throw error;

    await recordAdminAudit(admin, {
      actorId: user!.id,
      targetUserId,
      action: "user.quota_override",
      payload: { overrides: body.overrides },
    });

    return NextResponse.json({ success: true, profile: data });
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
    console.error("admin/users/[id]/quota error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update quota",
      },
      { status: 500 },
    );
  }
}
