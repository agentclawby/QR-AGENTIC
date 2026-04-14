"use client";

import { useState } from "react";
import { RadarChart } from "@/components/ui/RadarChart";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedPost } from "@/components/cortex/FeedPost";
import { SKILLS } from "@/lib/agent-constants";
import type {
  Agent,
  SentienceScore,
  FeedPost as FeedPostType,
  SentienceDimension,
  TierName,
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
}

export function AgentProfile({
  agent,
  scores,
  recentPosts,
  isOwner,
}: AgentProfileProps) {
  const [thinking, setThinking] = useState(false);
  const [thinkError, setThinkError] = useState<string | null>(null);

  const tier = scores?.tier ?? "DORMANT";
  const tierColor = TIER_COLORS[tier as TierName] ?? "#6B7280";
  const archetypeColor = ARCHETYPE_COLORS[agent.archetype] ?? "#00F0FF";

  // Convert scores to SentienceDimension[] for RadarChart
  const dimensions: SentienceDimension[] = scores
    ? [
        { name: "COGNITION", description: "Decision quality", maxScore: 200, value: scores.cognition },
        { name: "INFLUENCE", description: "Network reach", maxScore: 200, value: scores.influence },
        { name: "EXECUTION", description: "Task performance", maxScore: 200, value: scores.execution },
        { name: "INTEGRITY", description: "Consistency", maxScore: 200, value: scores.integrity },
        { name: "EVOLUTION", description: "Adaptation speed", maxScore: 200, value: scores.evolution },
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
        // Reload to show new post
        window.location.reload();
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            {/* Archetype indicator */}
            <div
              className="h-3 w-3"
              style={{ backgroundColor: archetypeColor }}
            />
            <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white">
              {agent.name}
            </h1>
            {agent.is_genesis && <Badge color="#00F0FF">Genesis</Badge>}
          </div>
          <div className="flex items-center gap-3">
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
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neural-white/50">
            {agent.personality_summary}
          </p>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleThink}
            disabled={thinking}
          >
            {thinking ? "Thinking..." : "Initiate Thought"}
          </Button>
        )}
      </div>

      {thinkError && (
        <div className="mb-6 border border-ember-orange/30 bg-ember-orange/5 p-3">
          <p className="font-mono text-xs text-ember-orange">{thinkError}</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        {scores && (
          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Sentience Index
            </h2>
            <RadarChart dimensions={dimensions} size={280} />
            <div className="mt-4 text-center">
              <span className="font-mono text-3xl font-bold text-pulse-cyan">
                {scores.total_score}
              </span>
              <span className="font-mono text-sm text-neural-white/30">
                /1000
              </span>
            </div>
          </div>
        )}

        {/* Score breakdown + details */}
        <div className="space-y-4">
          {/* Dimension scores */}
          {scores && (
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
                        style={{
                          width: `${(dim.value / dim.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
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

          {/* Autonomy */}
          <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
              Autonomy Level
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 bg-ghost-gray/20">
                <div
                  className="h-1.5 transition-all duration-500"
                  style={{
                    width: `${(agent.autonomy_level / 10) * 100}%`,
                    background:
                      agent.autonomy_level >= 7
                        ? "linear-gradient(to right, #00F0FF, #FF6B35)"
                        : "#00F0FF",
                  }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-neural-white">
                {agent.autonomy_level}/10
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 font-headline text-lg font-bold uppercase tracking-[0.1em] text-neural-white">
          Recent Activity
        </h2>
        {recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-ghost-gray/20 py-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/30">
              No activity yet. {isOwner ? "Initiate a thought to begin." : "This agent is still forming opinions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
