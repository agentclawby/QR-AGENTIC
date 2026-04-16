import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSystemCapabilities } from "@/lib/config/features";
import { fetchRecentTweets, fetchTwitterUser } from "@/lib/x/twitterapi";
import { extractXPersonality } from "@/lib/ai/personality-extractor";

const ingestSchema = z.object({
  force: z.boolean().optional().default(false),
  userName: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const body = ingestSchema.parse(rawBody);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, x_handle, username")
      .eq("id", user.id)
      .single();

    const capabilities = getSystemCapabilities();
    if (!capabilities.x_import.enabled) {
      return NextResponse.json(
        { error: capabilities.x_import.reason },
        { status: 503 }
      );
    }

    const userName =
      body.userName?.replace(/^@/, "") ??
      profile?.x_handle ??
      profile?.username ??
      null;

    if (!userName) {
      return NextResponse.json(
        { error: "No X handle is linked to this profile" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("x_personality_cache")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existing && !body.force) {
      const msSinceIngest =
        Date.now() - new Date(existing.ingested_at).getTime();
      if (msSinceIngest < 24 * 60 * 60 * 1000) {
        return NextResponse.json({
          success: true,
          rateLimited: true,
          retryAt: new Date(
            new Date(existing.ingested_at).getTime() + 24 * 60 * 60 * 1000
          ).toISOString(),
          cache: existing,
        });
      }
    }

    const [rawProfile, tweetResult] = await Promise.all([
      fetchTwitterUser(userName),
      fetchRecentTweets(userName, 80),
    ]);

    if (tweetResult.normalized.length < 25) {
      return NextResponse.json(
        {
          error: "Not enough usable X posts found. At least 25 authored posts are required.",
          usablePostCount: tweetResult.normalized.length,
        },
        { status: 400 }
      );
    }

    const extracted = await extractXPersonality({
      handle: userName,
      bio: rawProfile?.description,
      tweets: tweetResult.normalized,
    });

    const payload = {
      profile_id: user.id,
      source_handle: userName,
      raw_profile: rawProfile ?? {},
      raw_posts: tweetResult.raw,
      normalized_posts: tweetResult.normalized,
      usable_post_count: tweetResult.normalized.length,
      personality_traits: extracted.traits,
      personality_overlay: extracted.overlay,
      ingested_at: new Date().toISOString(),
    };

    const { data: cache, error } = await supabase
      .from("x_personality_cache")
      .upsert(payload, { onConflict: "profile_id" })
      .select("*")
      .single();

    if (error || !cache) {
      return NextResponse.json(
        { error: "Failed to store X personality cache" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rateLimited: false,
      cache,
    });
  } catch (error) {
    console.error("X ingest error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to ingest X personality",
      },
      { status: 500 }
    );
  }
}
