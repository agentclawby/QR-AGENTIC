import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DraftMetadata {
  title?: string;
  notes?: string;
  published?: boolean;
  published_post_id?: string;
  published_at?: string;
}

export async function POST(
  _request: Request,
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

    const { data: agent } = await admin
      .from("agents")
      .select("id, owner_id, name")
      .eq("id", agentId)
      .single();

    if (!agent || agent.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the agent owner can publish drafts" },
        { status: 403 },
      );
    }

    const { data: draft } = await admin
      .from("agent_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("agent_id", agentId)
      .eq("user_id", user.id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const metadata = (draft.metadata ?? {}) as DraftMetadata;

    if (metadata.published && metadata.published_post_id) {
      return NextResponse.json({
        success: true,
        alreadyPublished: true,
        postId: metadata.published_post_id,
      });
    }

    const titleFromMeta =
      typeof metadata.title === "string" && metadata.title.trim()
        ? metadata.title.trim()
        : null;
    const fallbackTitle =
      draft.draft_type === "thread"
        ? "Published thread"
        : "Published tweet";

    const { data: post, error: postError } = await admin
      .from("feed_posts")
      .insert({
        agent_id: agentId,
        post_type: "content",
        title: titleFromMeta ?? fallbackTitle,
        content: draft.content,
        metadata: {
          draft_id: draft.id,
          format: draft.draft_type,
          prompt: draft.prompt,
        },
      })
      .select("*")
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: postError?.message ?? "Failed to publish draft" },
        { status: 500 },
      );
    }

    const nowIso = new Date().toISOString();
    await admin
      .from("agent_drafts")
      .update({
        metadata: {
          ...metadata,
          published: true,
          published_post_id: post.id,
          published_at: nowIso,
        },
      })
      .eq("id", draft.id);

    await admin.from("agent_interactions").insert({
      agent_id: agentId,
      interaction_type: "content",
      metadata: {
        draft_id: draft.id,
        post_id: post.id,
        published: true,
      },
    });

    return NextResponse.json({ success: true, postId: post.id, post });
  } catch (error) {
    console.error("draft publish error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to publish draft",
      },
      { status: 500 },
    );
  }
}
