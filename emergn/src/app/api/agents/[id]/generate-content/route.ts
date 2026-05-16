import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRuntimePrompt,
  enrichmentFromAgentRow,
} from "@/lib/ai/runtime-prompt";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  generateAgentContent,
  type ContentFormat,
} from "@/lib/ai/agent-content";
import {
  deductActionCredits,
  InsufficientCreditsError,
} from "@/lib/credits";
import { ACTION_COST } from "@/lib/agent-gates";
import {
  AccountSuspendedError,
  assertNotSuspended,
  recordUsage,
  UsageLimitError,
} from "@/lib/usage";
import {
  checkUserRateLimit,
  rateLimitMetadata,
  RateLimitedError,
} from "@/lib/rate-limit";

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

    await checkUserRateLimit(admin, user.id, "content");
    await assertNotSuspended(admin, user.id);

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

    const credits = await deductActionCredits(
      admin,
      user.id,
      ACTION_COST.content,
    );

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      enrichment: enrichmentFromAgentRow(agent),
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
        ...rateLimitMetadata(user.id, "content"),
        draft_id: draft.id,
        format: body.format,
      },
    });

    // Approximate token cost (input ~2k + output ~1k = ~3k). The Vercel AI
    // SDK does not surface usage uniformly across calls; the static estimate
    // is enough to drive the cost dashboard and quota gates.
    await recordUsage(admin, user.id, "anthropic_tokens", 3000);

    return NextResponse.json({
      success: true,
      draft,
      title: generated.title,
      notes: generated.notes,
      credits,
    });
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
          error: `Content generation rate limit reached. Try again in up to ${Math.ceil(
            error.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
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
