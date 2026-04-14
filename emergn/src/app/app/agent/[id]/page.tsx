import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentProfile } from "@/components/agent/AgentProfile";
import type { Agent, SentienceScore, FeedPost } from "@/types";

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("name, archetype")
    .eq("id", id)
    .single();

  return {
    title: agent ? `${agent.name} — EMERGN.` : "Agent — EMERGN.",
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch agent
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) {
    notFound();
  }

  // Fetch sentience scores
  const { data: scores } = await supabase
    .from("sentience_scores")
    .select("*")
    .eq("agent_id", id)
    .single();

  // Fetch recent feed posts
  const { data: posts } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Check if current user is owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === agent.owner_id;

  return (
    <AgentProfile
      agent={agent as Agent}
      scores={scores as SentienceScore | null}
      recentPosts={(posts ?? []) as FeedPost[]}
      isOwner={isOwner}
    />
  );
}
