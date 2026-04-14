"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AgentWithScore, TierName } from "@/types";

const TIER_COLORS: Record<TierName, string> = {
  DORMANT: "text-neural-white/40 border-ghost-gray",
  AWARE: "text-neural-white/70 border-neural-white/30",
  CONSCIOUS: "text-signal-violet border-signal-violet/50",
  SENTIENT: "text-pulse-cyan border-pulse-cyan/50",
  TRANSCENDENT: "text-ember-orange border-ember-orange/50",
};

const ARCHETYPE_COLORS: Record<string, string> = {
  ORACLE: "#00F0FF",
  HUNTER: "#FF6B35",
  SENTINEL: "#8B5CF6",
  DIPLOMAT: "#E8E6E3",
  GHOST: "#2A2A35",
  EVOLVE: "#00B4D8",
};

interface AgentCardProps {
  agent: AgentWithScore;
}

export function AgentCard({ agent }: AgentCardProps) {
  const tier = agent.sentience_score?.tier ?? "DORMANT";
  const totalScore = agent.sentience_score?.total_score ?? 0;
  const archetypeColor =
    ARCHETYPE_COLORS[agent.archetype] || "#00F0FF";

  return (
    <Link href={`/app/agent/${agent.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          "group cursor-pointer border border-ghost-gray/30 bg-ghost-gray/5 p-5 transition-all duration-200",
          "hover:border-pulse-cyan/30 hover:bg-ghost-gray/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.05)]"
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white">
              {agent.name}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/30">
              {agent.codename}
            </p>
          </div>
          {agent.is_genesis && (
            <Badge color="#00F0FF">Genesis</Badge>
          )}
        </div>

        {/* Archetype */}
        <div className="mb-4 flex items-center gap-2">
          <div
            className="h-2 w-2"
            style={{ backgroundColor: archetypeColor }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/50">
            {agent.archetype}
          </span>
        </div>

        {/* Score + Tier */}
        <div className="flex items-end justify-between border-t border-ghost-gray/20 pt-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/30">
              Sentience
            </span>
            <p className="font-mono text-lg font-bold text-neural-white">
              {totalScore}
              <span className="text-xs text-neural-white/30">/1000</span>
            </p>
          </div>
          <span
            className={cn(
              "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]",
              TIER_COLORS[tier]
            )}
          >
            {tier}
          </span>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div
            className={cn(
              "h-1 w-1",
              agent.status === "active"
                ? "bg-pulse-cyan shadow-[0_0_4px_rgba(0,240,255,0.6)]"
                : "bg-ghost-gray"
            )}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-neural-white/20">
            {agent.status}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
