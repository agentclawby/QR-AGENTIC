import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentProfile } from "@/components/agent/AgentProfile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import { ensureUserCreditBalance } from "@/lib/credits";
import type {
  Agent,
  AgentDraft,
  AgentToken,
  FeedPost,
  Profile,
  SentienceScore,
  TrainingModule,
  TrainingSession,
  UserCreditBalance,
} from "@/types";

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
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    .select("*, agent:agents(id, name, codename, archetype, avatar_seed)")
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const isOwner = user?.id === agent.owner_id;

  const [{ data: viewerProfile }, { data: trainingModules }, { data: trainingSessions }, { data: drafts }, { data: agentToken }] =
    await Promise.all([
      user
        ? supabase.from("profiles").select("*").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      supabase.from("training_modules").select("*").order("name", { ascending: true }),
      isOwner
        ? supabase
            .from("training_sessions")
            .select("*")
            .eq("agent_id", id)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
      isOwner
        ? supabase
            .from("agent_drafts")
            .select("*")
            .eq("agent_id", id)
            .eq("user_id", user!.id)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
      supabase.from("agent_tokens").select("*").eq("agent_id", id).maybeSingle(),
    ]);

  const viewerCredits = user
    ? await ensureUserCreditBalance(admin, user.id)
    : null;
  const capabilities = getSystemCapabilities({
    walletAddress: viewerProfile?.wallet_address ?? null,
  });

  return (
    <AgentProfile
      agent={agent as Agent}
      scores={scores as SentienceScore | null}
      recentPosts={(posts ?? []) as FeedPost[]}
      isOwner={isOwner}
      viewerProfile={(viewerProfile ?? null) as Profile | null}
      trainingModules={(trainingModules ?? []) as TrainingModule[]}
      trainingSessions={(trainingSessions ?? []) as TrainingSession[]}
      drafts={(drafts ?? []) as AgentDraft[]}
      agentToken={(agentToken ?? null) as AgentToken | null}
      viewerCredits={(viewerCredits ?? null) as UserCreditBalance | null}
      capabilities={capabilities}
    />
  );
}
