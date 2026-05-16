import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRuntimePrompt,
  enrichmentFromAgentRow,
} from "@/lib/ai/runtime-prompt";
import { generateAgentConsultation } from "@/lib/ai/agent-consult";
import { getSystemCapabilities } from "@/lib/config/features";
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
import { getSplTokenBalanceForOwner } from "@/lib/solana/token-balance";
import {
  checkUserRateLimit,
  rateLimitMetadata,
  RateLimitedError,
} from "@/lib/rate-limit";

const consultSchema = z.object({
  query: z.string().trim().min(8).max(1000),
  isPremium: z.boolean().optional().default(false),
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

    const body = consultSchema.parse(await request.json());

    await checkUserRateLimit(admin, user.id, "consult");
    await assertUsageWithinLimit(admin, user.id, "consults");

    const [{ data: profile }, { data: agent }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, wallet_address")
        .eq("id", user.id)
        .single(),
      admin.from("agents").select("*").eq("id", agentId).single(),
    ]);

    if (!profile || !agent) {
      return NextResponse.json(
        { error: "Profile or agent not found" },
        { status: 404 }
      );
    }

    const isOwner = agent.owner_id === user.id;
    let accessMode = isOwner ? "owner" : "unlocked";
    let credits = await ensureUserCreditBalance(admin, user.id);
    const gateThreshold = BigInt(String(agent.token_gate_threshold ?? 0));

    if (!isOwner) {
      let tokenUnlocked = false;

      if (agent.token_mint && gateThreshold > 0n && profile.wallet_address) {
        const balance = await getSplTokenBalanceForOwner({
          owner: profile.wallet_address,
          mint: agent.token_mint,
        });
        tokenUnlocked = balance >= gateThreshold;
      }

      if (tokenUnlocked) {
        accessMode = "token_holder";
      } else {
        // Single-pool model: any non-token consultation costs 1 credit.
        credits = await deductActionCredits(
          admin,
          user.id,
          ACTION_COST.consult,
        );
        accessMode = "credit";
      }
    }

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      enrichment: enrichmentFromAgentRow(agent),
      modeInstructions:
        "Respond as a public consultation. Be useful, concise, and credible. This output will be publicly visible.",
    });

    const consultation = await generateAgentConsultation({
      runtimePrompt,
      agentName: agent.name,
      query: body.query,
    });

    const proofHash = `0x${randomBytes(32).toString("hex")}`;
    const { data: post, error: postError } = await admin
      .from("feed_posts")
      .insert({
        agent_id: agent.id,
        post_type: "consultation",
        title: consultation.title,
        content: consultation.content,
        reasoning_chain: consultation.reasoningChain,
        metadata: {
          query: body.query,
          access_mode: accessMode,
          public: true,
        },
        proof_hash: proofHash,
      })
      .select("*")
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Failed to persist consultation output" },
        { status: 500 }
      );
    }

    await admin.from("consultations").insert({
      agent_id: agent.id,
      user_id: user.id,
      query: body.query,
      response_post_id: post.id,
      is_premium: accessMode === "credit",
    });

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "consult",
      metadata: {
        ...rateLimitMetadata(user.id, "consult"),
        post_id: post.id,
        access_mode: accessMode,
      },
    });

    await recordUsage(admin, user.id, "consults", 1);
    // Approx 3k tokens per consult (Claude Sonnet 4 input+output blend).
    await recordUsage(admin, user.id, "anthropic_tokens", 3000);

    return NextResponse.json({
      success: true,
      post,
      accessMode,
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
          error: `Consultation rate limit reached. Try again in up to ${Math.ceil(
            error.retryAfterSeconds / 60
          )} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }
    console.error("Consultation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to run consultation",
      },
      { status: 500 }
    );
  }
}
