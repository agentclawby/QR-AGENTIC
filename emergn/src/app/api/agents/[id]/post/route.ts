// Post on behalf of the agent's owner to their connected X account.
//
// Body: { content: string, scheduledFor?: ISO 8601 string, draftId?: uuid }
// - immediate: status='sending' → call X → 'sent' or 'failed'
// - scheduled: status='scheduled', no X call (worker route picks up later)
//
// Strict scoping: every read/write filters by both agent_id AND owner_id.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getXPostToken } from "@/lib/x/tokens";
import { postTweet, XPostError } from "@/lib/x/post";

const postSchema = z.object({
  content: z.string().trim().min(1).max(280),
  scheduledFor: z.string().datetime().optional(),
  draftId: z.string().uuid().optional(),
  // When set, the post is sent as a reply to this X tweet id. The tweet body
  // should NOT include the leading "@handle" — X auto-prepends mentions for
  // in-thread replies.
  inReplyToTweetId: z
    .string()
    .trim()
    .regex(/^[0-9]{1,32}$/)
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: agent } = await admin
    .from("agents")
    .select("id, owner_id")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const scheduledFor = parsed.data.scheduledFor
    ? new Date(parsed.data.scheduledFor)
    : null;
  const isScheduled = scheduledFor !== null && scheduledFor.getTime() > Date.now();

  if (isScheduled) {
    // Reply target persists alongside the scheduled row so the worker that
    // wakes up later still has the parent tweet id when it calls the X API.
    const scheduledRow: Record<string, unknown> = {
      agent_id: agentId,
      owner_id: user.id,
      draft_id: parsed.data.draftId ?? null,
      status: "scheduled",
      scheduled_for: scheduledFor!.toISOString(),
      content: parsed.data.content,
    };
    if (parsed.data.inReplyToTweetId) {
      scheduledRow.x_response = {
        pending_reply_to: parsed.data.inReplyToTweetId,
      };
    }

    const { data: row, error } = await admin
      .from("agent_posts")
      .insert(scheduledRow)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
    }
    return NextResponse.json({ status: "scheduled", post: row });
  }

  const token = await getXPostToken(admin, user.id);
  if (!token) {
    return NextResponse.json(
      { error: "Sign in with X to enable posting." },
      { status: 412 }
    );
  }

  // Optimistic insert as 'sending' so a crash mid-call still leaves a trail.
  const { data: row } = await admin
    .from("agent_posts")
    .insert({
      agent_id: agentId,
      owner_id: user.id,
      draft_id: parsed.data.draftId ?? null,
      status: "sending",
      content: parsed.data.content,
    })
    .select("*")
    .single();

  try {
    const result = await postTweet(token.access_token, parsed.data.content, {
      inReplyToTweetId: parsed.data.inReplyToTweetId ?? null,
    });
    await admin
      .from("agent_posts")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        x_post_id: result.id,
        x_response: {
          id: result.id,
          text: result.text,
          in_reply_to_tweet_id: parsed.data.inReplyToTweetId ?? null,
        },
      })
      .eq("id", row!.id)
      .eq("owner_id", user.id);

    await admin.from("agent_interactions").insert({
      agent_id: agentId,
      owner_id: user.id,
      interaction_type: "x_post_attempt",
      metadata: {
        status: "sent",
        x_post_id: result.id,
        post_id: row!.id,
        in_reply_to_tweet_id: parsed.data.inReplyToTweetId ?? null,
      },
    });

    return NextResponse.json({ status: "sent", post: { ...row, ...result } });
  } catch (err) {
    const status = err instanceof XPostError ? err.status : 500;
    const reason = err instanceof Error ? err.message : "X post failed";
    await admin
      .from("agent_posts")
      .update({ status: "failed", error_message: reason })
      .eq("id", row!.id)
      .eq("owner_id", user.id);
    await admin.from("agent_interactions").insert({
      agent_id: agentId,
      owner_id: user.id,
      interaction_type: "x_post_attempt",
      metadata: { status: "failed", error: reason, post_id: row!.id },
    });
    return NextResponse.json({ error: reason }, { status });
  }
}

// GET — list this agent's posts, owner-only.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("agent_posts")
    .select("*")
    .eq("agent_id", agentId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ posts: data ?? [] });
}
