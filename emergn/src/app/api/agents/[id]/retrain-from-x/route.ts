import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deductActionCredits,
  InsufficientCreditsError,
} from "@/lib/credits";
import { ACTION_COST } from "@/lib/agent-gates";
import {
  AccountSuspendedError,
  assertUsageWithinLimit,
  recordUsage,
  UsageLimitError,
} from "@/lib/usage";
import { getSystemCapabilities } from "@/lib/config/features";
import { fetchRecentTweets, TwitterApiBudgetError } from "@/lib/x/twitterapi";
import { extractXPersonality } from "@/lib/ai/personality-extractor";
import { clampScore } from "@/lib/sentience/calculator";
import {
  checkUserRateLimit,
  rateLimitHeaders,
  rateLimitMetadata,
  RateLimitedError,
} from "@/lib/rate-limit";

const TWEETS_PER_RETRAIN = 40;
const INFLUENCE_BOOST = 5;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
    if (!capabilities.x_import.enabled) {
      return NextResponse.json(
        { error: capabilities.x_import.reason },
        { status: 503 },
      );
    }
    if (!capabilities.anthropic.enabled) {
      return NextResponse.json(
        { error: capabilities.anthropic.reason },
        { status: 503 },
      );
    }

    const limitInfo = await checkUserRateLimit(admin, user.id, "x_ingest");
    const limitResponseHeaders = rateLimitHeaders(limitInfo);
    await assertUsageWithinLimit(admin, user.id, "x_calls");

    const [{ data: agent }, { data: profile }, { data: scores }] =
      await Promise.all([
        admin
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .eq("owner_id", user.id)
          .single(),
        admin
          .from("profiles")
          .select("id, x_handle")
          .eq("id", user.id)
          .single(),
        admin
          .from("sentience_scores")
          .select("*")
          .eq("agent_id", agentId)
          .single(),
      ]);

    if (!agent) {
      return NextResponse.json(
        { error: "Only the agent owner can retrain on X." },
        { status: 403 },
      );
    }
    if (!profile?.x_handle) {
      return NextResponse.json(
        { error: "Link your X account in Settings before retraining." },
        { status: 400 },
      );
    }
    if (!scores) {
      return NextResponse.json(
        { error: "Sentience scores missing for this agent." },
        { status: 404 },
      );
    }

    // Pre-deduct credits so concurrent calls can't double-spend.
    const credits = await deductActionCredits(
      admin,
      user.id,
      ACTION_COST.x_retrain,
    );

    const tweetResult = await fetchRecentTweets(
      profile.x_handle,
      TWEETS_PER_RETRAIN,
    );
    if (tweetResult.normalized.length < 1) {
      return NextResponse.json(
        {
          error: `No usable X posts found for @${profile.x_handle}. The indexer may not have crawled your tweets yet — try again later.`,
        },
        { status: 400 },
      );
    }

    const extracted = await extractXPersonality({
      handle: profile.x_handle,
      bio: null,
      tweets: tweetResult.normalized,
      maxTweets: TWEETS_PER_RETRAIN,
    });

    const trainingOverlay = [
      agent.training_overlay?.trim(),
      `[X-RETRAIN ${new Date().toISOString().slice(0, 10)}] ${extracted.overlay}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const updatedInfluence = clampScore(
      Number(scores.influence) + INFLUENCE_BOOST,
    );

    await Promise.all([
      admin
        .from("agents")
        .update({
          training_overlay: trainingOverlay,
          training_level: Number(agent.training_level ?? 0) + 1,
        })
        .eq("id", agent.id),
      admin
        .from("sentience_scores")
        .update({ influence: updatedInfluence })
        .eq("agent_id", agent.id),
      admin.from("training_sessions").insert({
        agent_id: agent.id,
        user_id: user.id,
        module_id: "x_retrain",
        result_context: extracted.overlay.slice(0, 800),
        score_change: { influence: INFLUENCE_BOOST },
        status: "completed",
      }),
    ]);

    await admin.from("agent_interactions").insert({
      agent_id: agent.id,
      interaction_type: "train",
      metadata: {
        ...rateLimitMetadata(user.id, "x_ingest"),
        source: "x_retrain",
        tweets_analyzed: tweetResult.normalized.length,
        score_boost: INFLUENCE_BOOST,
      },
    });

    await recordUsage(admin, user.id, "x_calls", 1);
    await recordUsage(admin, user.id, "trainings", 1);
    await recordUsage(admin, user.id, "anthropic_tokens", 4500);

    return NextResponse.json(
      {
        success: true,
        summary: `Retrained on ${tweetResult.normalized.length} of your latest X posts. Influence +${INFLUENCE_BOOST}.`,
        tweetsAnalyzed: tweetResult.normalized.length,
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
    if (error instanceof TwitterApiBudgetError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof RateLimitedError) {
      return NextResponse.json(
        {
          error: `X retrain rate limit reached. Try again in up to ${Math.ceil(
            error.retryAfterSeconds / 60,
          )} minutes.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(error.retryAfterSeconds),
            "RateLimit-Reset": String(error.retryAfterSeconds),
          },
        },
      );
    }
    console.error("X retrain error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to retrain on X",
      },
      { status: 500 },
    );
  }
}
