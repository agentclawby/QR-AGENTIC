import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeRefineAgentFromFeedback } from "@/lib/agents/refinement";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: agent } = await admin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: "Only the owner can manually trigger refinement" },
        { status: 403 }
      );
    }

    const refinement = await maybeRefineAgentFromFeedback({
      supabase: admin,
      agent,
    });

    return NextResponse.json({ success: true, refinement });
  } catch (error) {
    console.error("Refine error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to refine agent",
      },
      { status: 500 }
    );
  }
}
