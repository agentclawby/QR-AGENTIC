import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRuntimePrompt,
  enrichmentFromAgentRow,
} from "@/lib/ai/runtime-prompt";
import { generateTrainingOverlay } from "@/lib/ai/agent-trainer";
import { getSystemCapabilities } from "@/lib/config/features";
import { clampScore } from "@/lib/sentience/calculator";
import {
  deductActionCredits,
  ensureUserCreditBalance,
  InsufficientCreditsError,
} from "@/lib/credits";
import { ACTION_COST } from "@/lib/agent-gates";
import {
  AccountSuspendedError,
  assertUsageWithinLimit,
  recordUsage,
  UsageLimitError,
} from "@/lib/usage";
import {
  checkUserRateLimit,
  rateLimitHeaders,
  rateLimitMetadata,
  RateLimitedError,
} from "@/lib/rate-limit";
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

    const limitInfo = await checkUserRateLimit(admin, user.id, "train");
    const limitResponseHeaders = rateLimitHeaders(limitInfo);
    await assertUsageWithinLimit(admin, user.id, "trainings");

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
    if ((credits.action_credits ?? 0) < ACTION_COST.train) {
      return NextResponse.json(
        {
          error: `Need ${ACTION_COST.train} credit; you have ${credits.action_credits ?? 0}.`,
        },
        { status: 402 },
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
      enrichment: enrichmentFromAgentRow(agent),
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

    credits = await deductActionCredits(admin, user.id, ACTION_COST.train);

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      owner_id: user.id,
      interaction_type: "train",
      metadata: {
        ...rateLimitMetadata(user.id, "train"),
        module_id: module.id,
        score_boost: module.sentience_boost,
      },
    });

    // Surface training as a feed post so the user actually *sees* a result.
    // Without this, training felt like a no-op.
    await admin.from("feed_posts").insert({
      agent_id: agent.id,
      post_type: "training",
      title: `Trained · ${module.name}`,
      content: training.summary,
      reasoning_chain: [
        {
          step: 1,
          label: "module",
          content: module.name,
        },
        {
          step: 2,
          label: "boost",
          content: `${module.sentience_dimension} +${module.sentience_boost}`,
        },
        {
          step: 3,
          label: "overlay",
          content: training.overlay.slice(0, 1200),
        },
      ],
      proof_hash: null,
    });

    await recordUsage(admin, user.id, "trainings", 1);
    await recordUsage(admin, user.id, "anthropic_tokens", 3500);

    return NextResponse.json(
      {
        success: true,
        sessionId: session?.id,
        overlay: training.overlay,
        summary: training.summary,
        credits,
      },
      { headers: limitResponseHeaders },
    );
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof AccountSuspendedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof RateLimitedError) {
      return NextResponse.json(
        {
          error: `Training rate limit reached. Try again in up to ${Math.ceil(
            error.retryAfterSeconds / 60
          )} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
            "RateLimit-Reset": String(error.retryAfterSeconds),
          },
        }
      );
    }
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
