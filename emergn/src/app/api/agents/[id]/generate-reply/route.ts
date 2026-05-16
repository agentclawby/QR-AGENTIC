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
  generateAgentReply,
  type ReplyIntent,
} from "@/lib/ai/agent-reply";
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

const replySchema = z.object({
  targetTweet: z.string().trim().min(3).max(1200),
  targetAuthor: z.string().trim().max(80).optional().nullable(),
  inReplyToTweetId: z
    .string()
    .trim()
    .regex(/^[0-9]{1,32}$/)
    .optional()
    .nullable(),
  intent: z
    .enum(["agree", "disagree", "add-context", "ask-question", "thank", "freeform"])
    .default("freeform"),
  extraNotes: z.string().trim().max(400).optional(),
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

    const body = replySchema.parse(await request.json());

    // Reuse the content rate-limit bucket — replies and content are the same
    // class of action from a load perspective.
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
        { error: "Only the agent owner can draft replies" },
        { status: 403 }
      );
    }

    const credits = await deductActionCredits(
      admin,
      user.id,
      ACTION_COST.content
    );

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      enrichment: enrichmentFromAgentRow(agent),
      modeInstructions:
        "Generate an X reply. Optimize for voice fidelity and reply etiquette. Stay under 280 chars.",
    });

    const generated = await generateAgentReply({
      runtimePrompt,
      agentName: agent.name,
      targetAuthor: body.targetAuthor ?? null,
      targetTweet: body.targetTweet,
      intent: body.intent as ReplyIntent,
      extraNotes: body.extraNotes,
    });

    const { data: draft, error } = await admin
      .from("agent_drafts")
      .insert({
        agent_id: agent.id,
        user_id: user.id,
        draft_type: "reply",
        prompt: body.targetTweet.slice(0, 800),
        content: generated.content,
        metadata: {
          title: `Reply to @${body.targetAuthor ?? "unknown"}`,
          notes: generated.notes,
          intent: body.intent,
          in_reply_to_tweet_id: body.inReplyToTweetId ?? null,
          target_author: body.targetAuthor ?? null,
        },
      })
      .select("*")
      .single();

    if (error || !draft) {
      // PGRST04 schema cache miss = migration 012 hasn't run yet (the 'reply'
      // draft_type constraint update lives there). Surface a useful message.
      const code = (error as { code?: string } | null)?.code;
      const message =
        code === "23514"
          ? "agent_drafts is missing the 'reply' type. Apply migration 012_persona_enrichment_and_replies.sql."
          : "Failed to store reply draft";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "content",
      metadata: {
        ...rateLimitMetadata(user.id, "content"),
        draft_id: draft.id,
        format: "reply",
        intent: body.intent,
      },
    });

    // Reply round-trips are smaller than tweet/thread (shorter context +
    // shorter completion). 1.2k tokens is a fair blended estimate.
    await recordUsage(admin, user.id, "anthropic_tokens", 1200);

    return NextResponse.json({
      success: true,
      draft,
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
          error: `Reply rate limit reached. Try again in up to ${Math.ceil(
            error.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
    console.error("Generate reply error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate reply",
      },
      { status: 500 }
    );
  }
}
