import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentProfile } from "@/components/agent/AgentProfile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSystemCapabilities } from "@/lib/config/features";
import {
  buildUnavailableCreditBalance,
  ensureUserCreditBalance,
} from "@/lib/credits";
import type {
  Agent,
  AgentDraft,
  AgentPassport,
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

  const normalizedAgent = {
    ...agent,
    personality_source: agent.personality_source ?? "archetype",
    personality_overlay: agent.personality_overlay ?? "",
    training_overlay: agent.training_overlay ?? "",
    refinement_overlay: agent.refinement_overlay ?? "",
    // Migration 012 fields; default to empty so pre-migration agents still
    // render and the Persona tab can be edited as soon as the migration runs.
    backstory: agent.backstory ?? "",
    beliefs: agent.beliefs ?? "",
    opinions: agent.opinions ?? "",
    quirks: agent.quirks ?? "",
    do_not_say: agent.do_not_say ?? "",
    style_exemplars: Array.isArray(agent.style_exemplars)
      ? agent.style_exemplars
      : [],
    persona_updated_at: agent.persona_updated_at ?? null,
    token_mint: agent.token_mint ?? null,
    token_gate_threshold: Number(agent.token_gate_threshold ?? 0),
    training_level: Number(agent.training_level ?? 0),
    last_refinement_at: agent.last_refinement_at ?? null,
  };

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

  const [{ data: viewerProfile }, { data: trainingModules }, { data: trainingSessions }, { data: drafts }, { data: agentToken }, { data: agentPassport }] =
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
      supabase
        .from("agent_passports")
        .select("*")
        .eq("agent_id", id)
        .maybeSingle(),
    ]);

  // Anonymous viewers see the agent page with viewerCredits = null. The
  // AgentProfile component already handles that path (the credit pill simply
  // doesn't render). For signed-in viewers we lazy-init the balance row so
  // first-time users see their starter credits before any action.
  let viewerCredits = null;
  if (user) {
    try {
      viewerCredits = await ensureUserCreditBalance(admin, user.id);
    } catch (error) {
      console.error("Agent page credit setup warning:", error);
      viewerCredits = buildUnavailableCreditBalance(user.id);
    }
  }
  const capabilities = getSystemCapabilities({
    walletAddress: viewerProfile?.wallet_address ?? null,
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AgentProfile
        agent={normalizedAgent as Agent}
        scores={scores as SentienceScore | null}
        recentPosts={(posts ?? []) as FeedPost[]}
        isOwner={isOwner}
        viewerProfile={(viewerProfile ?? null) as Profile | null}
        trainingModules={(trainingModules ?? []) as TrainingModule[]}
        trainingSessions={(trainingSessions ?? []) as TrainingSession[]}
        drafts={(drafts ?? []) as AgentDraft[]}
        agentPassport={(agentPassport ?? null) as AgentPassport | null}
        agentToken={(agentToken ?? null) as AgentToken | null}
        viewerCredits={(viewerCredits ?? null) as UserCreditBalance | null}
        capabilities={capabilities}
      />
    </div>
  );
}
