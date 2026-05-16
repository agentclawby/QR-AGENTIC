import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  awardActionCredits,
  EarnCapReachedError,
} from "@/lib/credits";
import {
  AccountSuspendedError,
  assertNotSuspended,
} from "@/lib/usage";
import {
  fetchTweetById,
  TwitterApiBudgetError,
} from "@/lib/x/twitterapi";

const APPROVE_THRESHOLD = 0.8;
const REVIEW_THRESHOLD = 0.6;

const claimSchema = z.object({
  tweet_url: z.string().trim().url(),
});

interface DraftMetadata {
  title?: string;
  notes?: string;
  published?: boolean;
  published_post_id?: string;
  claimed_credit?: {
    tweet_id: string;
    awarded_at: string;
    status: "approved" | "rejected" | "manual_review";
  };
}

function parseTweetUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") return null;
  // /<handle>/status/<id>
  const match = parsed.pathname.match(/^\/([A-Za-z0-9_]{1,30})\/status\/(\d+)/);
  if (!match) return null;
  return { handle: match[1], tweetId: match[2] };
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

// Cheap normalized similarity: word-overlap Jaccard on bag-of-words.
// Levenshtein on 280-char strings is O(n²); Jaccard handles paraphrase well
// for tweet-length copy and is O(n+m).
function similarity(a: string, b: string): number {
  const aw = new Set(normalize(a).split(" ").filter(Boolean));
  const bw = new Set(normalize(b).split(" ").filter(Boolean));
  if (aw.size === 0 || bw.size === 0) return 0;
  let inter = 0;
  for (const w of aw) if (bw.has(w)) inter += 1;
  const union = new Set([...aw, ...bw]).size;
  return inter / union;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; draftId: string }> },
) {
  try {
    const { id: agentId, draftId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await assertNotSuspended(admin, user.id);

    const body = claimSchema.parse(await request.json());
    const parsed = parseTweetUrl(body.tweet_url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid X tweet URL." },
        { status: 400 },
      );
    }

    const [{ data: profile }, { data: draft }] = await Promise.all([
      admin
        .from("profiles")
        .select("id, x_handle")
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("agent_drafts")
        .select("*")
        .eq("id", draftId)
        .eq("agent_id", agentId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!profile?.x_handle) {
      return NextResponse.json(
        { error: "Link your X account before claiming credits." },
        { status: 400 },
      );
    }
    if (!draft) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }

    const handleMatches =
      profile.x_handle.toLowerCase() === parsed.handle.toLowerCase();
    if (!handleMatches) {
      return NextResponse.json(
        {
          error: `Tweet author @${parsed.handle} does not match your linked handle @${profile.x_handle}.`,
        },
        { status: 400 },
      );
    }

    // Tweet uniqueness via the unique index on credit_claims.tweet_id.
    const { data: existingClaim } = await admin
      .from("credit_claims")
      .select("id, status")
      .eq("tweet_id", parsed.tweetId)
      .maybeSingle();
    if (existingClaim) {
      return NextResponse.json(
        { error: "This tweet has already been claimed." },
        { status: 409 },
      );
    }

    let tweetText = "";
    try {
      const tweet = await fetchTweetById(parsed.tweetId);
      tweetText = tweet.normalized?.text ?? "";
    } catch (error) {
      if (error instanceof TwitterApiBudgetError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      throw error;
    }

    if (!tweetText) {
      return NextResponse.json(
        { error: "Could not fetch the tweet. Make sure the URL is public." },
        { status: 404 },
      );
    }

    const score = Number(similarity(draft.content ?? "", tweetText).toFixed(3));
    let status: "approved" | "rejected" | "manual_review";
    let reason: string | null;
    if (score >= APPROVE_THRESHOLD) {
      status = "approved";
      reason = null;
    } else if (score >= REVIEW_THRESHOLD) {
      status = "manual_review";
      reason = "Borderline similarity; pending operator review.";
    } else {
      status = "rejected";
      reason = "Content does not match the draft closely enough.";
    }

    const { data: claim, error: insertError } = await admin
      .from("credit_claims")
      .insert({
        user_id: user.id,
        draft_id: draft.id,
        tweet_id: parsed.tweetId,
        tweet_url: body.tweet_url,
        similarity: score,
        status,
        reason,
      })
      .select("*")
      .single();

    if (insertError || !claim) {
      // Race: another concurrent claim won the unique index.
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { error: "This tweet was just claimed by another request." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to record claim." },
        { status: 500 },
      );
    }

    let awarded = false;
    if (status === "approved") {
      try {
        await awardActionCredits(admin, user.id, 1);
        awarded = true;
      } catch (error) {
        if (error instanceof EarnCapReachedError) {
          await admin
            .from("credit_claims")
            .update({
              status: "rejected",
              reason: "Daily earn cap reached.",
            })
            .eq("id", claim.id);
          return NextResponse.json({ error: error.message }, { status: 429 });
        }
        throw error;
      }
    }

    const meta = (draft.metadata ?? {}) as DraftMetadata;
    await admin
      .from("agent_drafts")
      .update({
        metadata: {
          ...meta,
          claimed_credit: {
            tweet_id: parsed.tweetId,
            awarded_at: new Date().toISOString(),
            status,
          },
        },
      })
      .eq("id", draft.id);

    return NextResponse.json({
      success: true,
      status,
      similarity: score,
      awarded,
      reason,
    });
  } catch (error) {
    if (error instanceof AccountSuspendedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 },
      );
    }
    console.error("claim-x-post error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to claim credit.",
      },
      { status: 500 },
    );
  }
}
