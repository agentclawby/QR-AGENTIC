import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminAccessError, requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await requireAdmin(admin, { user });

    const url = new URL(request.url);
    const search = url.searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
      200,
    );

    let query = admin
      .from("admin_user_overview")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      const escaped = search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `username.ilike.%${escaped}%,x_handle.ilike.%${escaped}%,wallet_address.ilike.%${escaped}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const { data: audit } = await admin
      .from("admin_audit_log")
      .select("id, actor_id, target_user_id, action, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ users: data ?? [], audit: audit ?? [] });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("admin/users GET error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load users",
      },
      { status: 500 },
    );
  }
}
