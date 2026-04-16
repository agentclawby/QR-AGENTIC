import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeRefineAgentFromFeedback } from "@/lib/agents/refinement";

const feedbackSchema = z.object({
  postId: z.string().uuid(),
  rating: z.union([z.literal(-1), z.literal(1)]),
  feedbackText: z.string().trim().max(500).optional(),
});

export async function POST(
  request: Request,
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

    const body = feedbackSchema.parse(await request.json());
    const { data: agent } = await admin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { data: feedback, error } = await admin
      .from("agent_feedback")
      .upsert(
        {
          agent_id: agentId,
          post_id: body.postId,
          user_id: user.id,
          rating: body.rating,
          feedback_text: body.feedbackText ?? null,
          processed_for_refinement: false,
        },
        { onConflict: "post_id,user_id" }
      )
      .select("*")
      .single();

    if (error || !feedback) {
      return NextResponse.json(
        { error: "Failed to submit feedback" },
        { status: 500 }
      );
    }

    await admin.from("agent_interactions").insert({
      agent_id: agentId,
      interaction_type: "feedback",
      metadata: {
        user_id: user.id,
        rating: body.rating,
        post_id: body.postId,
      },
    });

    const refinement = await maybeRefineAgentFromFeedback({
      supabase: admin,
      agent,
    });

    return NextResponse.json({
      success: true,
      feedback,
      refinement,
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}
