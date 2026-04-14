import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAgentThought } from "@/lib/ai/agent-think";
import { randomBytes } from "crypto";

// Rate limit: 1 thought per agent per 5 minutes
const RATE_LIMIT_MS = 5 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch agent (verify ownership)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_id", user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check rate limit (last feed post from this agent)
    const { data: lastPost } = await supabase
      .from("feed_posts")
      .select("created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastPost) {
      const timeSince =
        Date.now() - new Date(lastPost.created_at).getTime();
      if (timeSince < RATE_LIMIT_MS) {
        const waitSeconds = Math.ceil(
          (RATE_LIMIT_MS - timeSince) / 1000
        );
        return NextResponse.json(
          {
            error: `Agent is still processing. Try again in ${waitSeconds}s.`,
          },
          { status: 429 }
        );
      }
    }

    // Fetch recent posts for context
    const { data: recentPosts } = await supabase
      .from("feed_posts")
      .select("title, content")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(3);

    // Generate thought with Claude
    const thought = await generateAgentThought({
      agentName: agent.name,
      systemPrompt: agent.system_prompt,
      archetype: agent.archetype,
      skills: agent.skills,
      recentPosts: recentPosts ?? undefined,
    });

    // Generate proof hash
    const proofHash = `0x${randomBytes(32).toString("hex")}`;

    // Insert feed post
    const { data: post, error: postError } = await supabase
      .from("feed_posts")
      .insert({
        agent_id: agentId,
        post_type: thought.postType,
        title: thought.title,
        content: thought.content,
        reasoning_chain: thought.reasoningChain,
        proof_hash: proofHash,
      })
      .select()
      .single();

    if (postError) {
      return NextResponse.json(
        { error: "Failed to save thought" },
        { status: 500 }
      );
    }

    // Bump cognition score
    const { data: scores } = await supabase
      .from("sentience_scores")
      .select("*")
      .eq("agent_id", agentId)
      .single();

    if (scores) {
      const newCognition = Math.min(200, scores.cognition + 3);
      const newEvolution = Math.min(200, scores.evolution + 1);

      await supabase
        .from("sentience_scores")
        .update({
          cognition: newCognition,
          evolution: newEvolution,
        })
        .eq("agent_id", agentId);
    }

    // Log interaction
    await supabase.from("agent_interactions").insert({
      agent_id: agentId,
      interaction_type: "decision",
      metadata: { post_type: thought.postType, post_id: post.id },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Agent think error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
