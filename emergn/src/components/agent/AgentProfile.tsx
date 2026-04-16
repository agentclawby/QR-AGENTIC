"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RadarChart } from "@/components/ui/RadarChart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedPost } from "@/components/cortex/FeedPost";
import { ConsultAgent } from "@/components/agent/ConsultAgent";
import { ContentGenerator } from "@/components/agent/ContentGenerator";
import { PortfolioView } from "@/components/agent/PortfolioView";
import { TokenInfo } from "@/components/agent/TokenInfo";
import { TokenLaunch } from "@/components/agent/TokenLaunch";
import { TrainingModuleCard } from "@/components/training/TrainingModuleCard";
import { SKILLS } from "@/lib/agent-constants";
import type {
  Agent,
  AgentDraft,
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

interface AgentProfileProps {
  agent: Agent;
  scores: SentienceScore | null;
  recentPosts: FeedPostType[];
  isOwner: boolean;
  viewerProfile: Profile | null;
  trainingModules: TrainingModule[];
  trainingSessions: TrainingSession[];
  drafts: AgentDraft[];
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
  agentToken,
  viewerCredits,
  capabilities,
}: AgentProfileProps) {
  const router = useRouter();
  const [thinking, setThinking] = useState(false);
  const [thinkError, setThinkError] = useState<string | null>(null);

  const tier = scores?.tier ?? "DORMANT";
  const tierColor = TIER_COLORS[tier as TierName] ?? "#6B7280";
  const archetypeColor = ARCHETYPE_COLORS[agent.archetype] ?? "#00F0FF";

  const dimensions: SentienceDimension[] = scores
    ? [
        {
          name: "COGNITION",
          description: "Decision quality",
          maxScore: 200,
          value: scores.cognition,
        },
        {
          name: "INFLUENCE",
          description: "Network reach",
          maxScore: 200,
          value: scores.influence,
        },
        {
          name: "EXECUTION",
          description: "Task performance",
          maxScore: 200,
          value: scores.execution,
        },
        {
          name: "INTEGRITY",
          description: "Consistency",
          maxScore: 200,
          value: scores.integrity,
        },
        {
          name: "EVOLUTION",
          description: "Adaptation speed",
          maxScore: 200,
          value: scores.evolution,
        },
      ]
    : [];

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

  const skillNames = agent.skills.map(
    (id) => SKILLS.find((s) => s.id === id)?.name ?? id
  );
  const thinkDisabledReason = capabilities.anthropic.enabled
    ? null
    : capabilities.anthropic.reason;
  const consultationDisabledReason = capabilities.anthropic.enabled
    ? null
    : capabilities.anthropic.reason;
  const contentDisabledReason = capabilities.anthropic.enabled
    ? null
    : capabilities.anthropic.reason;
  const portfolioDisabledReason = !capabilities.portfolio_analysis.enabled
    ? capabilities.portfolio_analysis.reason
    : !viewerProfile?.wallet_address
      ? "Link a wallet in Settings before running a portfolio review."
      : null;
  const trainingDisabledReason = !capabilities.anthropic.enabled
    ? capabilities.anthropic.reason
    : (viewerCredits?.training_credits ?? 0) <= 0
      ? "Buy training credits before applying a module."
      : null;
  const tokenLaunchDisabledReason = !capabilities.token_launch.enabled
    ? capabilities.token_launch.reason
    : !viewerProfile?.wallet_address
      ? "Link your owner wallet in Settings before launching a token."
      : null;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-3 w-3" style={{ backgroundColor: archetypeColor }} />
            <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
              {agent.name}
            </h1>
            {agent.is_genesis ? <Badge color="#00F0FF">Genesis</Badge> : null}
            {agent.personality_source !== "archetype" ? (
              <Badge color="#8B5CF6">Voice Imported</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/30">
              {agent.codename}
            </span>
            <span className="text-neural-white/10">|</span>
            <span
              className="font-mono text-xs uppercase tracking-[0.15em]"
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
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neural-white/50">
            {agent.personality_summary}
          </p>
        </div>

        {isOwner ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleThink}
            disabled={thinking || Boolean(thinkDisabledReason)}
          >
            {thinking ? "Thinking..." : "Initiate Thought"}
          </Button>
        ) : null}
      </div>

      {thinkError ? (
        <div className="mb-6 border border-ember-orange/30 bg-ember-orange/5 p-3">
          <p className="font-mono text-xs text-ember-orange">{thinkError}</p>
        </div>
      ) : null}

      {isOwner && thinkDisabledReason ? (
        <div className="mb-6 border border-ghost-gray/20 bg-ghost-gray/5 p-3">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-neural-white/40">
            {thinkDisabledReason}
          </p>
        </div>
      ) : null}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {scores ? (
          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Sentience Index
            </h2>
            <RadarChart dimensions={dimensions} size={280} />
            <div className="mt-4 text-center">
              <span className="font-mono text-3xl font-bold text-pulse-cyan">
                {scores.total_score}
              </span>
              <span className="font-mono text-sm text-neural-white/30">/1000</span>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {scores ? (
            <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
                Dimension Breakdown
              </h2>
              <div className="space-y-3">
                {dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/50">
                        {dim.name}
                      </span>
                      <span className="font-mono text-xs text-neural-white/60">
                        {dim.value}/{dim.maxScore}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-ghost-gray/20">
                      <div
                        className="h-1 bg-pulse-cyan transition-all duration-500"
                        style={{ width: `${(dim.value / dim.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skillNames.map((skill) => (
                <Badge key={skill} color="#00F0FF">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Runtime Layers
            </h2>
            <div className="space-y-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
              <p>Voice overlay: {agent.personality_overlay ? "active" : "inactive"}</p>
              <p>Training overlay: {agent.training_overlay ? "active" : "inactive"}</p>
              <p>Refinement overlay: {agent.refinement_overlay ? "active" : "inactive"}</p>
              <p>Training level: {agent.training_level}</p>
              <p>
                Linked X: {viewerProfile?.x_handle ? `@${viewerProfile.x_handle}` : "not linked"}
              </p>
              {viewerProfile?.wallet_address ? (
                <p>Viewer wallet: {viewerProfile.wallet_address.slice(0, 6)}...{viewerProfile.wallet_address.slice(-4)}</p>
              ) : (
                <p>Viewer wallet: not linked</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ConsultAgent
          agentId={agent.id}
          tokenGateThreshold={agent.token_gate_threshold}
          disabledReason={consultationDisabledReason}
          viewerCredits={viewerCredits}
          walletLinked={Boolean(viewerProfile?.wallet_address)}
        />
        <PortfolioView
          agentId={agent.id}
          walletAddress={viewerProfile?.wallet_address ?? null}
          disabledReason={portfolioDisabledReason}
        />
      </div>

      {isOwner ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <ContentGenerator
            agentId={agent.id}
            initialDrafts={drafts}
            disabledReason={contentDisabledReason}
          />
          <div className="space-y-6">
            {agentToken?.status === "launched" ? <TokenInfo agentId={agent.id} /> : null}
            <TokenLaunch
              agentId={agent.id}
              agentToken={agentToken}
              linkedWalletAddress={viewerProfile?.wallet_address ?? null}
              disabledReason={tokenLaunchDisabledReason}
            />
          </div>
        </div>
      ) : agentToken?.status === "launched" ? (
        <div className="mb-8">
          <TokenInfo agentId={agent.id} />
        </div>
      ) : null}

      {isOwner ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <div className="mb-5">
              <h2 className="font-headline text-lg font-bold uppercase tracking-[0.1em] text-neural-white">
                Training Modules
              </h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
                Spend training credits to add knowledge and improve sentience dimensions.
                {" "}Balance: {viewerCredits?.training_credits ?? 0}
              </p>
              {trainingDisabledReason ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
                  {trainingDisabledReason}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3">
              {trainingModules.map((module) => (
                <TrainingModuleCard
                  key={module.id}
                  agentId={agent.id}
                  module={module}
                  disabledReason={trainingDisabledReason}
                  creditsRemaining={viewerCredits?.training_credits ?? 0}
                />
              ))}
            </div>
          </div>

          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
              Recent Training
            </h2>
            {trainingSessions.length > 0 ? (
              <div className="space-y-3">
                {trainingSessions.map((session) => (
                  <div key={session.id} className="border border-ghost-gray/15 bg-void-black p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan">
                      {session.module_id}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
                      {session.status} · {new Date(session.created_at).toLocaleString()}
                    </p>
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
      ) : null}

      <div>
        <h2 className="mb-4 font-headline text-lg font-bold uppercase tracking-[0.1em] text-neural-white">
          Recent Activity
        </h2>
        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
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
        ) : (
          <div className="border border-dashed border-ghost-gray/20 py-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/30">
              No activity yet.{" "}
              {isOwner
                ? "Initiate a thought to begin."
                : "This agent is still forming opinions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
