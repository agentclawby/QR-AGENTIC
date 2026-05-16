import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminAccessError,
  recordAdminAudit,
  requireAdmin,
} from "@/lib/admin";

const roleSchema = z.object({
  role: z.enum(["user", "admin"]),
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

    const body = roleSchema.parse(await request.json());

    if (user!.id === targetUserId && body.role === "user") {
      return NextResponse.json(
        { error: "You cannot demote yourself." },
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ role: body.role })
      .eq("id", targetUserId)
      .select("id, role")
      .single();

    if (error) throw error;

    await recordAdminAudit(admin, {
      actorId: user!.id,
      targetUserId,
      action: "role.update",
      payload: { role: body.role },
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
    console.error("admin/users/[id]/role error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update role",
      },
      { status: 500 },
    );
  }
}
