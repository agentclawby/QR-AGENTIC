import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRuntimePrompt } from "@/lib/ai/runtime-prompt";
import { generateTrainingOverlay } from "@/lib/ai/agent-trainer";
import { getSystemCapabilities } from "@/lib/config/features";
import { clampScore } from "@/lib/sentience/calculator";
import { ensureUserCreditBalance, updateUserCredits } from "@/lib/credits";
import type { TrainingModule } from "@/types";

const trainSchema = z.object({
  moduleId: z.string().trim().min(1),
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

    const body = trainSchema.parse(await request.json());

    const [{ data: agent }, { data: module }, { data: scores }] = await Promise.all([
      admin
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .eq("owner_id", user.id)
        .single(),
      admin
        .from("training_modules")
        .select("*")
        .eq("id", body.moduleId)
        .single(),
      admin
        .from("sentience_scores")
        .select("*")
        .eq("agent_id", agentId)
        .single(),
    ]);

    if (!agent) {
      return NextResponse.json(
        { error: "Only the agent owner can train this agent" },
        { status: 403 }
      );
    }

    if (!module || !scores) {
      return NextResponse.json(
        { error: "Training module or sentience score not found" },
        { status: 404 }
      );
    }

    let credits = await ensureUserCreditBalance(admin, user.id);
    if (credits.training_credits < module.cost_credits) {
      return NextResponse.json(
        { error: "Not enough training credits" },
        { status: 402 }
      );
    }

    const { data: session } = await admin
      .from("training_sessions")
      .insert({
        agent_id: agent.id,
        user_id: user.id,
        module_id: body.moduleId,
        status: "running",
      })
      .select("*")
      .single();

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      modeInstructions:
        "Integrate this training as an additive capability. Do not erase the base personality.",
    });

    const training = await generateTrainingOverlay({
      agentName: agent.name,
      runtimePrompt,
      module: module as TrainingModule,
    });

    const updatedTrainingOverlay = [
      agent.training_overlay?.trim(),
      `[${module.name}] ${training.overlay}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const updatedDimension = clampScore(
      Number(scores[module.sentience_dimension]) + module.sentience_boost
    );

    await Promise.all([
      admin
        .from("agents")
        .update({
          training_overlay: updatedTrainingOverlay,
          training_level: Number(agent.training_level ?? 0) + 1,
        })
        .eq("id", agent.id),
      admin
        .from("sentience_scores")
        .update({
          [module.sentience_dimension]: updatedDimension,
        })
        .eq("agent_id", agent.id),
      admin
        .from("training_sessions")
        .update({
          result_context: training.overlay,
          score_change: {
            [module.sentience_dimension]: module.sentience_boost,
          },
          status: "completed",
        })
        .eq("id", session?.id),
    ]);

    credits = await updateUserCredits(admin, user.id, {
      training_credits: Math.max(
        0,
        credits.training_credits - module.cost_credits
      ),
    });

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "train",
      metadata: {
        module_id: module.id,
        score_boost: module.sentience_boost,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session?.id,
      overlay: training.overlay,
      summary: training.summary,
      credits,
    });
  } catch (error) {
    console.error("Training error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to train agent",
      },
      { status: 500 }
    );
  }
}
