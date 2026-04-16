import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRuntimePrompt } from "@/lib/ai/runtime-prompt";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  generateAgentContent,
  type ContentFormat,
} from "@/lib/ai/agent-content";

const contentSchema = z.object({
  topic: z.string().trim().min(3).max(500),
  format: z.enum(["tweet", "thread"]).default("tweet"),
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

    const capabilities = getSystemCapabilities();
    if (!capabilities.anthropic.enabled) {
      return NextResponse.json(
        { error: capabilities.anthropic.reason },
        { status: 503 }
      );
    }

    const body = contentSchema.parse(await request.json());
    const { data: agent } = await admin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: "Only the agent owner can generate private drafts" },
        { status: 403 }
      );
    }

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      modeInstructions:
        "Generate private X-ready content. Optimize for voice fidelity and copy-paste readiness.",
    });

    const generated = await generateAgentContent({
      runtimePrompt,
      agentName: agent.name,
      topic: body.topic,
      format: body.format as ContentFormat,
    });

    const { data: draft, error } = await admin
      .from("agent_drafts")
      .insert({
        agent_id: agent.id,
        user_id: user.id,
        draft_type: body.format,
        prompt: body.topic,
        content: generated.content,
        metadata: {
          title: generated.title,
          notes: generated.notes,
        },
      })
      .select("*")
      .single();

    if (error || !draft) {
      return NextResponse.json(
        { error: "Failed to store draft" },
        { status: 500 }
      );
    }

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "content",
      metadata: {
        draft_id: draft.id,
        format: body.format,
      },
    });

    return NextResponse.json({
      success: true,
      draft,
      title: generated.title,
      notes: generated.notes,
    });
  } catch (error) {
    console.error("Generate content error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}
