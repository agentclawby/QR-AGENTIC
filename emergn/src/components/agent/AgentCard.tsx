"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { Counter } from "@/components/ui/Counter";
import { cn } from "@/lib/utils";
import type { AgentWithScore, TierName } from "@/types";

const TIER_COLORS: Record<TierName, string> = {
  DORMANT: "#7A7A85",
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
  GHOST: "#2A2A35",
  EVOLVE: "#00B4D8",
};

interface AgentCardProps {
  agent: AgentWithScore;
}

export function AgentCard({ agent }: AgentCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const x = useSpring(mvX, { stiffness: 180, damping: 22 });
  const y = useSpring(mvY, { stiffness: 180, damping: 22 });
  const rotateX = useTransform(y, [0, 1], [3, -3]);
  const rotateY = useTransform(x, [0, 1], [-3, 3]);

  const tier = agent.sentience_score?.tier ?? "DORMANT";
  const totalScore = agent.sentience_score?.total_score ?? 0;
  const archetypeColor = ARCHETYPE_COLORS[agent.archetype] || "#00F0FF";
  const tierColor = TIER_COLORS[tier];

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mvX.set((e.clientX - rect.left) / rect.width);
    mvY.set((e.clientY - rect.top) / rect.height);
    ref.current.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    ref.current.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <Link href={`/app/agent/${agent.id}`} className="block">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={() => {
          mvX.set(0.5);
          mvY.set(0.5);
        }}
        whileHover={{ y: -4 }}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className={cn(
          "group spotlight relative cursor-pointer overflow-hidden border border-ghost-gray/40 bg-ghost-gray/5 p-4 transition-colors duration-300 sm:p-5",
          "hover:border-pulse-cyan/40 hover:bg-ghost-gray/10",
          "hover:shadow-[0_0_40px_rgba(0,240,255,0.12),inset_0_1px_0_rgba(0,240,255,0.12)]"
        )}
      >
        {/* archetype accent strip */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[2px] opacity-50 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: archetypeColor, boxShadow: `0 0 12px ${archetypeColor}` }}
        />

        {/* Header */}
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white transition-colors group-hover:text-pulse-cyan sm:tracking-[0.1em]">
              {agent.name}
            </h3>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
              {agent.codename}
            </p>
          </div>
          {agent.is_genesis && (
            <Badge color="#00F0FF" pulse>
              Genesis
            </Badge>
          )}
        </div>

        {/* Archetype */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className="h-2 w-2"
            style={{ backgroundColor: archetypeColor, boxShadow: `0 0 8px ${archetypeColor}` }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/60 sm:tracking-[0.15em]">
            {agent.archetype}
          </span>
        </div>

        {/* Score + Tier */}
        <div className="flex items-end justify-between gap-3 border-t border-ghost-gray/30 pt-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/40">
              Sentience
            </span>
            <p className="font-mono text-lg font-bold text-neural-white">
              <Counter end={totalScore} duration={1400} immediate />
              <span className="text-xs text-neural-white/40">/1000</span>
            </p>
          </div>
          <Badge color={tierColor}>{tier}</Badge>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5",
              agent.status === "active" ? "status-dot" : "bg-ghost-gray"
            )}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/40 sm:tracking-[0.15em]">
            {agent.status}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
