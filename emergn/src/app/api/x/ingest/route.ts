import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/profile";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  fetchRecentTweets,
  fetchTwitterUser,
  TwitterApiBudgetError,
} from "@/lib/x/twitterapi";
import { extractXPersonality } from "@/lib/ai/personality-extractor";
import {
  AccountSuspendedError,
  assertUsageWithinLimit,
  recordUsage,
  UsageLimitError,
} from "@/lib/usage";

const ingestSchema = z.object({
  force: z.boolean().optional().default(false),
  userName: z.string().trim().optional(),
  stream: z.boolean().optional().default(false),
});

type IngestInput = z.infer<typeof ingestSchema>;

interface ProgressEvent {
  type: "progress";
  progress: number;
  message: string;
}

type EmitProgress = (event: ProgressEvent) => void;

const X_VOICE_POST_LIMIT = 20;
const X_VOICE_MIN_USABLE_POSTS = 10;
const X_VOICE_ANTHROPIC_TOKEN_ESTIMATE = 2500;

class IngestHttpError extends Error {
  constructor(
    public payload: Record<string, unknown>,
    public status: number,
    public headers?: HeadersInit
  ) {
    super(String(payload.error ?? "X ingest failed"));
    this.name = "IngestHttpError";
  }
}

function emitProgress(
  emit: EmitProgress | undefined,
  progress: number,
  message: string
) {
  emit?.({ type: "progress", progress, message });
}

function errorToResponse(error: unknown) {
  if (error instanceof IngestHttpError) {
    return {
      payload: error.payload,
      init: { status: error.status, headers: error.headers },
    };
  }
  if (error instanceof UsageLimitError) {
    return {
      payload: { error: error.message },
      init: { status: error.status },
    };
  }
  if (error instanceof AccountSuspendedError) {
    return {
      payload: { error: error.message },
      init: { status: error.status },
    };
  }
  if (error instanceof TwitterApiBudgetError) {
    return {
      payload: { error: error.message },
      init: { status: error.status },
    };
  }

  console.error("X ingest error:", error);
  return {
    payload: {
      error:
        error instanceof Error ? error.message : "Failed to ingest X personality",
    },
    init: { status: 500 },
  };
}

async function runIngest(body: IngestInput, emit?: EmitProgress) {
  emitProgress(emit, 4, "Authenticating session");

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new IngestHttpError({ error: "Not authenticated" }, 401);
  }

  // Wallet-first SIWS users are created via admin.createUser() which doesn't
  // fire the on_auth_user_created trigger, so their profiles row is missing.
  // x_personality_cache.profile_id is a NOT NULL FK to profiles.id — the
  // upsert below FK-violates and we surface "Failed to store X personality
  // cache" with no actionable info. Self-heal before the FK insert.
  await ensureUserProfile(admin, user);

  emitProgress(emit, 10, "Checking X voice import setup");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, x_handle, username")
    .eq("id", user.id)
    .single();

  const capabilities = getSystemCapabilities();
  if (!capabilities.x_import.enabled) {
    throw new IngestHttpError(
      { error: capabilities.x_import.reason },
      503
    );
  }

  const userName =
    body.userName?.replace(/^@/, "") ??
    profile?.x_handle ??
    profile?.username ??
    null;

  if (!userName) {
    throw new IngestHttpError(
      { error: "No X handle is linked to this profile" },
      400
    );
  }

  emitProgress(emit, 18, "Checking saved voice cache");

  const { data: existing } = await supabase
    .from("x_personality_cache")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    const ingestedAtMs = new Date(existing.ingested_at).getTime();
    const msSinceIngest = Date.now() - ingestedAtMs;

    // Soft cache: re-use cached overlay for 24h unless caller passes force.
    if (!body.force && msSinceIngest < 24 * 60 * 60 * 1000) {
      emitProgress(emit, 100, "Using saved voice overlay");
      return {
        success: true,
        rateLimited: true,
        retryAt: new Date(
          ingestedAtMs + 24 * 60 * 60 * 1000
        ).toISOString(),
        cache: existing,
      };
    }

    // Hard floor on force=true ingestion: max ~5/hour (one every 12 min).
    // TwitterAPI.io and Anthropic both cost real money per call.
    const FORCE_MIN_INTERVAL_MS = 12 * 60 * 1000;
    if (body.force && msSinceIngest < FORCE_MIN_INTERVAL_MS) {
      const retryAfterSeconds = Math.ceil(
        (FORCE_MIN_INTERVAL_MS - msSinceIngest) / 1000
      );
      throw new IngestHttpError(
        {
          error: `X ingestion is rate-limited. Try again in ~${Math.ceil(
            retryAfterSeconds / 60
          )} minutes.`,
          retryAfterSeconds,
        },
        429,
        { "Retry-After": String(retryAfterSeconds) }
      );
    }
  }

  emitProgress(emit, 28, "Checking usage limits");

  await assertUsageWithinLimit(admin, user.id, "x_calls");
  await assertUsageWithinLimit(
    admin,
    user.id,
    "anthropic_tokens",
    X_VOICE_ANTHROPIC_TOKEN_ESTIMATE
  );

  emitProgress(
    emit,
    34,
    `Fetching profile and up to ${X_VOICE_POST_LIMIT} recent posts from X`
  );

  const [rawProfile, tweetResult] = await Promise.all([
    fetchTwitterUser(userName),
    fetchRecentTweets(userName, X_VOICE_POST_LIMIT),
  ]);

  emitProgress(
    emit,
    58,
    `Found ${tweetResult.normalized.length} usable authored posts`
  );

  if (tweetResult.normalized.length < X_VOICE_MIN_USABLE_POSTS) {
    throw new IngestHttpError(
      {
        error: `Not enough usable X posts found. At least ${X_VOICE_MIN_USABLE_POSTS} authored posts are required.`,
        usablePostCount: tweetResult.normalized.length,
      },
      400
    );
  }

  emitProgress(emit, 72, "Extracting voice pattern with AI");

  const extracted = await extractXPersonality({
    handle: userName,
    bio: rawProfile?.description,
    tweets: tweetResult.normalized,
    maxTweets: X_VOICE_POST_LIMIT,
  });

  emitProgress(emit, 88, "Saving voice overlay");

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
    throw new IngestHttpError(
      { error: "Failed to store X personality cache" },
      500
    );
  }

  await Promise.all([
    recordUsage(admin, user.id, "x_calls", 1),
    recordUsage(
      admin,
      user.id,
      "anthropic_tokens",
      X_VOICE_ANTHROPIC_TOKEN_ESTIMATE
    ),
  ]);

  emitProgress(emit, 100, "Voice overlay ready");

  return {
    success: true,
    rateLimited: false,
    cache,
  };
}

function createProgressStream(body: IngestInput) {
  const encoder = new TextEncoder();

  function encodeEvent(event: Record<string, unknown>) {
    return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encodeEvent(event));
      };
      const sendProgress: EmitProgress = (event) => {
        send({ ...event });
      };

      void runIngest(body, sendProgress)
        .then((data) => {
          send({
            type: "complete",
            progress: 100,
            message: "Voice overlay ready",
            data,
          });
        })
        .catch((error) => {
          const response = errorToResponse(error);
          send({
            type: "error",
            progress: 100,
            message: String(response.payload.error ?? "X ingest failed"),
            ...response.payload,
          });
        })
        .finally(() => {
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => ({}));
  const body = ingestSchema.parse(rawBody);

  if (body.stream) {
    return createProgressStream(body);
  }

  try {
    return NextResponse.json(await runIngest(body));
  } catch (error) {
    const response = errorToResponse(error);
    return NextResponse.json(response.payload, response.init);
  }
}
