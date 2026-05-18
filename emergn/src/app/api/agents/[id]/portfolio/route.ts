import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRuntimePrompt } from "@/lib/ai/runtime-prompt";
import { getSystemCapabilities } from "@/lib/config/features";
import { buildWalletPortfolioSnapshot } from "@/lib/portfolio/analyzer";
import { generatePortfolioAnalysis } from "@/lib/ai/agent-portfolio";
import {
  checkUserRateLimit,
  rateLimitHeaders,
  rateLimitMetadata,
  RateLimitedError,
} from "@/lib/rate-limit";

const portfolioSchema = z.object({
  walletAddress: z.string().trim().optional(),
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
    if (!capabilities.portfolio_analysis.enabled) {
      return NextResponse.json(
        { error: capabilities.portfolio_analysis.reason },
        { status: 503 }
      );
    }

    const body = portfolioSchema.parse(await request.json().catch(() => ({})));

    const limitInfo = await checkUserRateLimit(admin, user.id, "portfolio");
    const limitResponseHeaders = rateLimitHeaders(limitInfo);

    const [{ data: agent }, { data: profile }] = await Promise.all([
      admin.from("agents").select("*").eq("id", agentId).single(),
      supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single(),
    ]);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const requestedWallet = body.walletAddress?.trim();
    const walletAddress =
      agent.owner_id === user.id && requestedWallet
        ? requestedWallet
        : profile?.wallet_address ?? requestedWallet;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Connect a wallet before running portfolio analysis" },
        { status: 400 }
      );
    }

    const snapshot = await buildWalletPortfolioSnapshot(walletAddress);

    await admin
      .from("wallet_portfolio_cache")
      .upsert(
        {
          user_id: user.id,
          wallet_address: walletAddress,
          snapshot,
          last_analyzed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    const runtimePrompt = buildRuntimePrompt({
      systemPrompt: agent.system_prompt,
      personalityOverlay: agent.personality_overlay,
      trainingOverlay: agent.training_overlay,
      refinementOverlay: agent.refinement_overlay,
      modeInstructions:
        "Analyze the supplied wallet as a private portfolio review. Be direct, helpful, and caveat heuristic PnL clearly.",
    });

    const analysis = await generatePortfolioAnalysis({
      runtimePrompt,
      agentName: agent.name,
      walletAddress,
      snapshot,
    });

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "portfolio",
      metadata: {
        ...rateLimitMetadata(user.id, "portfolio"),
        wallet_address: walletAddress,
      },
    });

    return NextResponse.json(
      {
        success: true,
        walletAddress,
        snapshot,
        analysis,
      },
      { headers: limitResponseHeaders },
    );
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return NextResponse.json(
        {
          error: `Portfolio analysis rate limit reached. Try again in up to ${Math.ceil(
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
    console.error("Portfolio analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze portfolio",
      },
      { status: 500 }
    );
  }
}
