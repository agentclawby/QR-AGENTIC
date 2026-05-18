"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { RadarChart } from "@/components/ui/RadarChart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Reveal } from "@/components/effects/Reveal";
import { FeedPost } from "@/components/cortex/FeedPost";
import { ConsultAgent } from "@/components/agent/ConsultAgent";
import { ContentGenerator } from "@/components/agent/ContentGenerator";
import { PortfolioView } from "@/components/agent/PortfolioView";
import { AgentPassportPanel } from "@/components/agent/AgentPassportPanel";
import { AgentSettings } from "@/components/agent/AgentSettings";
import { AgentPersona } from "@/components/agent/AgentPersona";
import { TokenInfo } from "@/components/agent/TokenInfo";
import { TokenLaunch } from "@/components/agent/TokenLaunch";
import { TrainingModuleCard } from "@/components/training/TrainingModuleCard";
import { AgentCreditStrip } from "@/components/agent/AgentCreditStrip";
import { RetrainFromXCard } from "@/components/agent/RetrainFromXCard";
import { computeAgentGates } from "@/lib/agent-gates";
import { SKILLS } from "@/lib/agent-constants";
import type {
  Agent,
  AgentDraft,
  AgentPassport,
  AgentToken,
  FeedPost as FeedPostType,
  Profile,
  SentienceDimension,
  SentienceScore,
  SystemCapabilities,
  TierName,
  TrainingModule,
  TrainingSession,
  UserCreditBalance,
} from "@/types";

const TIER_COLORS: Record<TierName, string> = {
  DORMANT: "#6B7280",
  AWARE: "#E8E6E3",
  CONSCIOUS: "#8B5CF6",
  SENTIENT: "#00F0FF",
  TRANSCENDENT: "#FF6B35",
};

const ARCHETYPE_COLORS: Record<string, string> = {
  ORACLE: "#00F0FF",
  HUNTER: "#FF6B35",
  SENTINEL: "#8B5CF6",
  DIPLOMAT: "#E8E6E3",
  GHOST: "#6B7280",
  EVOLVE: "#00B4D8",
};

type TabId =
  | "overview"
  | "thoughts"
  | "training"
  | "persona"
  | "posts"
  | "passport"
  | "settings";

const TRIAL_BANNER_DISMISS_KEY = "emergn.agentTrialBannerDismissed";

interface AgentProfileProps {
  agent: Agent;
  scores: SentienceScore | null;
  recentPosts: FeedPostType[];
  isOwner: boolean;
  viewerProfile: Profile | null;
  trainingModules: TrainingModule[];
  trainingSessions: TrainingSession[];
  drafts: AgentDraft[];
  agentPassport: AgentPassport | null;
  agentToken: AgentToken | null;
  viewerCredits: UserCreditBalance | null;
  capabilities: SystemCapabilities;
}

export function AgentProfile({
  agent,
  scores,
  recentPosts,
  isOwner,
  viewerProfile,
  trainingModules,
  trainingSessions,
  drafts,
  agentPassport,
  agentToken,
  viewerCredits,
  capabilities,
}: AgentProfileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [thinking, setThinking] = useState(false);
  const [thinkError, setThinkError] = useState<string | null>(null);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(true);

  const tier = (scores?.tier ?? "DORMANT") as TierName;
  const tierColor = TIER_COLORS[tier] ?? "#6B7280";
  const archetypeColor = ARCHETYPE_COLORS[agent.archetype] ?? "#00F0FF";
  const launched = agentToken?.status === "launched";
  // Pre-migration fallback: sum legacy pools so all credit-aware UI shows a
  // real number instead of zero.
  const totalCredits =
    (viewerCredits?.action_credits ?? 0) > 0
      ? (viewerCredits?.action_credits ?? 0)
      : (viewerCredits?.training_credits ?? 0) +
        (viewerCredits?.premium_credits ?? 0) +
        (viewerCredits?.free_consults_remaining ?? 0);

  const gates = useMemo(
    () =>
      computeAgentGates({
        agent,
        capabilities,
        viewerProfile,
        viewerCredits,
        isOwner,
      }),
    [agent, capabilities, isOwner, viewerCredits, viewerProfile],
  );

  const dimensions: SentienceDimension[] = scores
    ? [
        { name: "COGNITION", description: "Decision quality", maxScore: 200, value: scores.cognition },
        { name: "INFLUENCE", description: "Network reach", maxScore: 200, value: scores.influence },
        { name: "EXECUTION", description: "Task performance", maxScore: 200, value: scores.execution },
        { name: "INTEGRITY", description: "Consistency", maxScore: 200, value: scores.integrity },
        { name: "EVOLUTION", description: "Adaptation speed", maxScore: 200, value: scores.evolution },
      ]
    : [];

  const skillNames = agent.skills.map(
    (id) => SKILLS.find((s) => s.id === id)?.name ?? id,
  );

  // Tabs always start at "overview" on the server-rendered HTML so SSR markup
  // matches the first client paint. After mount, we sync from the URL — that
  // avoids the hydration mismatch you'd get if the URL had ?tab=training but
  // the server rendered with no URL context.
  const validTabs: TabId[] = [
    "overview",
    "thoughts",
    "training",
    "persona",
    "posts",
    "passport",
    "settings",
  ];
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    const requestedTab = searchParams.get("tab") as TabId | null;
    if (requestedTab && validTabs.includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTrialBannerDismissed(
      window.localStorage.getItem(TRIAL_BANNER_DISMISS_KEY) === "1",
    );
  }, []);

  const handleTabChange = (next: TabId) => {
    setActiveTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const handleThink = async () => {
    setThinking(true);
    setThinkError(null);

    try {
      const res = await fetch(`/api/agents/${agent.id}/think`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setThinkError(data.error);
      } else {
        router.refresh();
      }
    } catch {
      setThinkError("Failed to initiate thought");
    } finally {
      setThinking(false);
    }
  };

  const dismissTrialBanner = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TRIAL_BANNER_DISMISS_KEY, "1");
    }
    setTrialBannerDismissed(true);
  };

  const showTrialBanner =
    !trialBannerDismissed &&
    isOwner &&
    (totalCredits) >= 5 &&
    !viewerCredits?.last_action_at;

  const thoughtTypes = ["decision", "analysis", "thought", "training"] as const;
  const postTypes = ["content", "consultation", "training_published"] as const;
  const thoughtPosts = recentPosts.filter((p) =>
    (thoughtTypes as readonly string[]).includes(p.post_type)
  );
  const postsList = recentPosts.filter((p) =>
    (postTypes as readonly string[]).includes(p.post_type)
  );
  const draftCount = drafts.filter(
    (d) => !((d.metadata as { published?: boolean })?.published)
  ).length;

  // Has the owner already added persona enrichment? Surface a small dot on the
  // Persona tab so they can see at a glance whether the agent has been hand-
  // tuned beyond the X import.
  const personaEnriched = Boolean(
    agent.backstory?.trim() ||
      agent.beliefs?.trim() ||
      agent.opinions?.trim() ||
      agent.quirks?.trim() ||
      agent.do_not_say?.trim() ||
      (agent.style_exemplars?.length ?? 0) > 0
  );

  const tabItems: TabItem<TabId>[] = [
    { id: "overview", label: "Overview" },
    {
      id: "thoughts",
      label: "Thoughts",
      badge: thoughtPosts.length || null,
    },
    {
      id: "training",
      label: "Training",
      hidden: !isOwner,
      badge: totalCredits,
    },
    {
      id: "persona",
      label: "Persona",
      hidden: !isOwner,
      badge: personaEnriched ? "✓" : null,
    },
    {
      id: "posts",
      label: "Posts",
      hidden: !isOwner,
      badge: draftCount || null,
    },
    {
      id: "passport",
      label: "Passport",
      badge: agentPassport?.status === "issued" ? "✓" : null,
    },
    {
      id: "settings",
      label: "Settings",
      hidden: !isOwner,
    },
  ];

  const overviewPosts = recentPosts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-3 w-3"
              style={{
                backgroundColor: archetypeColor,
                boxShadow: `0 0 10px ${archetypeColor}`,
              }}
            />
            <h1 className="min-w-0 break-words font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
              {agent.name}
            </h1>
            {agent.is_genesis ? (
              <Badge color="#00F0FF" pulse dot>
                Genesis
              </Badge>
            ) : null}
            {agent.personality_source !== "archetype" ? (
              <Badge color="#8B5CF6">Voice Imported</Badge>
            ) : null}
            {agentPassport?.status === "issued" ? (
              <Badge color="#00F0FF" dot>
                Passport
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="min-w-0 break-all font-mono text-xs uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.1em]">
              {agent.codename}
            </span>
            <span className="text-neural-white/10">|</span>
            <span
              className="font-mono text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em]"
              style={{ color: archetypeColor }}
            >
              {agent.archetype}
            </span>
            <span className="text-neural-white/10">|</span>
            <Badge color={tierColor}>{tier}</Badge>
            {agent.token_gate_threshold > 0 ? (
              <Badge color="#F59E0B">
                Gate {agent.token_gate_threshold.toLocaleString()}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-neural-white/65">
            {agent.personality_summary}
          </p>
        </div>

        {isOwner ? (
          <div className="relative w-full sm:w-auto">
            {thinking && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 border border-pulse-cyan"
                animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={handleThink}
              disabled={thinking || !gates.think.enabled}
              loading={thinking}
              className="w-full sm:w-auto"
            >
              Initiate Thought
            </Button>
          </div>
        ) : null}
      </motion.div>

      {/* Credit strip */}
      <AgentCreditStrip
        credits={viewerCredits}
        tier={tier}
        isOwner={isOwner}
      />

      {/* Trial banner */}
      {showTrialBanner ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start justify-between gap-3 border border-pulse-cyan/30 bg-pulse-cyan/[0.04] px-4 py-3 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-pulse-cyan sm:tracking-[0.18em]">
              Welcome — credits are on us
            </p>
            <p className="mt-1 text-xs text-neural-white/65">
              Train, consult, and publish freely with your starter credits.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissTrialBanner}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/45 hover:text-neural-white sm:tracking-[0.15em]"
          >
            Dismiss
          </button>
        </motion.div>
      ) : null}

      {/* Errors / disabled hints (only for owner) */}
      {thinkError ? (
        <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
          <p className="font-mono text-xs text-ember-orange">{thinkError}</p>
        </div>
      ) : null}
      {isOwner && gates.think.reason ? (
        <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-3">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-neural-white/40">
            {gates.think.reason}
          </p>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs<TabId>
        value={activeTab}
        onValueChange={handleTabChange}
        items={tabItems}
      />

      {/* Tab content */}
      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {scores ? (
              <Reveal
                variant="depth"
                className="relative overflow-hidden border border-ghost-gray/30 bg-ghost-gray/5 p-5 transition-colors duration-500 hover:border-pulse-cyan/30 sm:p-6"
              >
                <span aria-hidden className="hairline absolute inset-x-0 top-0" />
                <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan/70 sm:tracking-[0.2em]">
                  <span className="status-dot mr-2 align-middle" />
                  Sentience Index
                </h2>
                <RadarChart dimensions={dimensions} size={280} />
                <div className="mt-4 text-center">
                  <span className="font-mono text-4xl font-bold text-pulse-cyan glow-text-cyan">
                    <Counter end={scores.total_score} duration={2000} immediate />
                  </span>
                  <span className="font-mono text-sm text-neural-white/40">
                    /1000
                  </span>
                </div>
              </Reveal>
            ) : null}

            <div className="space-y-4">
              {scores ? (
                <Reveal
                  variant="depth"
                  delay={0.1}
                  className="border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6"
                >
                  <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/50 sm:tracking-[0.2em]">
                    Dimension Breakdown
                  </h2>
                  <div className="space-y-3">
                    {dimensions.map((dim, i) => (
                      <motion.div
                        key={dim.name}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: i * 0.08,
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/65 sm:tracking-[0.15em]">
                            {dim.name}
                          </span>
                          <span className="font-mono text-xs text-neural-white">
                            <Counter end={dim.value} duration={1400} immediate />
                            <span className="text-neural-white/40">
                              /{dim.maxScore}
                            </span>
                          </span>
                        </div>
                        <div className="relative h-1 w-full overflow-hidden bg-ghost-gray/30">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{
                              width: `${(dim.value / dim.maxScore) * 100}%`,
                            }}
                            viewport={{ once: true }}
                            transition={{
                              delay: i * 0.08 + 0.3,
                              duration: 1,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="h-full bg-gradient-to-r from-pulse-cyan via-signal-violet to-pulse-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Reveal>
              ) : null}

              <Reveal
                variant="depth"
                delay={0.2}
                className="border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6"
              >
                <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/50 sm:tracking-[0.2em]">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skillNames.map((skill, i) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: i * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Badge color="#00F0FF">{skill}</Badge>
                    </motion.div>
                  ))}
                </div>
              </Reveal>

              {/* Compact passport preview that links to the full Passport tab. */}
              <button
                type="button"
                onClick={() => handleTabChange("passport")}
                className="block w-full text-left"
              >
                <AgentPassportPanel
                  agentPassportImageUrl={agent.passport_image_url}
                  agentPassportImageStatus={agent.passport_image_status ?? "pending"}
                  agentId={agent.id}
                  passport={agentPassport}
                  isOwner={isOwner}
                  viewerUserId={viewerProfile?.id ?? null}
                  linkedWalletAddress={viewerProfile?.wallet_address ?? null}
                  disabledReason={gates.passport.reason}
                  agentCodename={agent.codename}
                  agentArchetype={agent.archetype}
                  agentTier={tier}
                />
              </button>
            </div>
          </div>

          <PortfolioView
            agentId={agent.id}
            walletAddress={viewerProfile?.wallet_address ?? null}
            disabledReason={gates.portfolio.reason}
          />

          {/* Consult lives on Overview as a primary inline action, accessible
              to both owners (free) and visitors (token-gated). Anonymous
              visitors see a "Sign In to Consult" button that redirects to
              /login with a return path back to this agent. */}
          <ConsultAgent
            agentId={agent.id}
            tokenGateThreshold={agent.token_gate_threshold}
            disabledReason={gates.consult.reason}
            viewerCredits={viewerCredits}
            walletLinked={Boolean(viewerProfile?.wallet_address)}
            isOwner={isOwner}
            isAnonymous={!viewerProfile}
          />

          {overviewPosts.length > 0 ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                  <span className="status-dot" />
                  Latest Activity
                </h2>
                <button
                  type="button"
                  onClick={() => handleTabChange("thoughts")}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-pulse-cyan hover:text-pulse-cyan/80 sm:tracking-[0.15em]"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-4">
                {overviewPosts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={
                      post.agent
                        ? post
                        : {
                            ...post,
                            agent: {
                              id: agent.id,
                              name: agent.name,
                              codename: agent.codename,
                              archetype: agent.archetype,
                              avatar_seed: agent.avatar_seed,
                            } as Agent,
                          }
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "training" && isOwner ? (
        <div className="space-y-6">
          <RetrainFromXCard
            agentId={agent.id}
            xHandle={viewerProfile?.x_handle ?? null}
            disabledReason={gates.xRetrain.reason}
            creditsRemaining={totalCredits}
          />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
            <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row">
              <div className="min-w-0">
                <h2 className="font-headline text-lg font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                  Training Modules
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
                  Each module costs 1 credit. The agent&apos;s sentience score
                  updates the moment training completes.
                </p>
              </div>
              <span className="shrink-0 border border-pulse-cyan/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
                {totalCredits} credits
              </span>
            </div>
            {gates.training.reason ? (
              <p className="mb-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
                {gates.training.reason}
              </p>
            ) : null}
            <div className="grid gap-3">
              {trainingModules.map((module) => (
                <TrainingModuleCard
                  key={module.id}
                  agentId={agent.id}
                  module={module}
                  disabledReason={gates.training.reason}
                  creditsRemaining={totalCredits}
                />
              ))}
            </div>
          </div>

          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
            <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
              Recent Training
            </h2>
            {trainingSessions.length > 0 ? (
              <div className="space-y-3">
                {trainingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-ghost-gray/15 bg-void-black p-4"
                  >
                    <p className="break-all font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
                      {session.module_id}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
                      {session.status} ·{" "}
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                    {session.result_context ? (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neural-white/60">
                        {session.result_context}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-ghost-gray/20 py-12 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/30">
                  No training sessions yet.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      ) : null}

      {activeTab === "thoughts" ? (
        <Reveal variant="soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 font-headline text-lg font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
              <span className="status-dot" />
              Agent Thoughts
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
              decisions · analyses · training
            </span>
          </div>
          {thoughtPosts.length > 0 ? (
            <div className="space-y-4">
              {thoughtPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <FeedPost
                    post={
                      post.agent
                        ? post
                        : {
                            ...post,
                            agent: {
                              id: agent.id,
                              name: agent.name,
                              codename: agent.codename,
                              archetype: agent.archetype,
                              avatar_seed: agent.avatar_seed,
                            } as Agent,
                          }
                    }
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden border border-dashed border-ghost-gray/30 px-4 py-12 text-center">
              <motion.div
                aria-hidden
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(0,240,255,0.10),transparent_70%)]"
              />
              <p className="relative font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/50 sm:tracking-[0.15em]">
                No thoughts yet.{" "}
                {isOwner
                  ? "Hit Initiate Thought above, or train a module."
                  : "This agent is still forming opinions."}
              </p>
            </div>
          )}
        </Reveal>
      ) : null}

      {activeTab === "persona" && isOwner ? (
        <AgentPersona
          agent={agent}
          isOwner={isOwner}
          voiceImported={agent.personality_source !== "archetype"}
        />
      ) : null}

      {activeTab === "posts" && isOwner ? (
        <div className="space-y-6">
          <ContentGenerator
            agentId={agent.id}
            initialDrafts={drafts}
            disabledReason={gates.content.reason}
            xHandle={viewerProfile?.x_handle ?? null}
          />
          {postsList.length > 0 ? (
            <div>
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
                Published
              </h3>
              <div className="space-y-4">
                {postsList.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={
                      post.agent
                        ? post
                        : {
                            ...post,
                            agent: {
                              id: agent.id,
                              name: agent.name,
                              codename: agent.codename,
                              archetype: agent.archetype,
                              avatar_seed: agent.avatar_seed,
                            } as Agent,
                          }
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "passport" ? (
        <AgentPassportPanel
          agentPassportImageUrl={agent.passport_image_url}
          agentPassportImageStatus={agent.passport_image_status ?? "pending"}
          agentId={agent.id}
          passport={agentPassport}
          isOwner={isOwner}
          viewerUserId={viewerProfile?.id ?? null}
          linkedWalletAddress={viewerProfile?.wallet_address ?? null}
          disabledReason={gates.passport.reason}
          agentCodename={agent.codename}
          agentArchetype={agent.archetype}
          agentTier={tier}
        />
      ) : null}

      {activeTab === "settings" && isOwner ? (
        <div className="space-y-6">
          <AgentSettings agent={agent} isOwner={isOwner} />
          {/* Token launch lives in Settings now — it's an owner-only operation
              that touches monetisation, not day-to-day agent activity. */}
          {launched ? <TokenInfo agentId={agent.id} /> : null}
          <TokenLaunch
            agentId={agent.id}
            agentToken={agentToken}
            linkedWalletAddress={viewerProfile?.wallet_address ?? null}
            disabledReason={gates.tokenLaunch.reason}
            agentName={agent.name}
            agentCodename={agent.codename}
            agentArchetype={agent.archetype}
            agentPersonalitySummary={agent.personality_summary}
            agentPassportImageUrl={agent.passport_image_url}
          />
        </div>
      ) : null}
    </div>
  );
}
