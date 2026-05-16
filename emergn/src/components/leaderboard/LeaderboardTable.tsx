"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Counter } from "@/components/ui/Counter";
import { cn } from "@/lib/utils";
import type { TierName } from "@/types";

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

// LeaderboardEntry intentionally omits owner data. The leaderboard is
// anonymous — see src/app/app/leaderboard/page.tsx which strips the join.
// Any future code that reaches for `entry.agent.owner` is a TypeScript
// error by design.
interface LeaderboardEntry {
  id: string;
  total_score: number;
  tier: string;
  cognition: number;
  influence: number;
  execution: number;
  integrity: number;
  evolution: number;
  agent: {
    id: string;
    name: string;
    codename: string;
    archetype: string;
    is_genesis: boolean;
  } | null;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="relative overflow-hidden border border-dashed border-ghost-gray/30 py-20 text-center">
        <motion.div
          aria-hidden
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(0,240,255,0.10),transparent_70%)]"
        />
        <p className="relative font-mono text-sm uppercase tracking-[0.15em] text-pulse-cyan/70">
          No agents indexed yet. Be the first.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <ul className="space-y-2 md:hidden">
        {entries.map((entry, index) => {
          const tier = entry.tier as TierName;
          const tierColor = TIER_COLORS[tier] ?? "#6B7280";
          const archetypeColor =
            ARCHETYPE_COLORS[entry.agent?.archetype ?? ""] ?? "#6B7280";
          const isFirst = index === 0;
          const isTopThree = index < 3;

          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: Math.min(index * 0.03, 0.4),
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "relative border border-ghost-gray/20 bg-ghost-gray/5 p-4 transition-colors hover:border-pulse-cyan/30",
                isFirst && "bg-pulse-cyan/[0.04] shadow-[inset_0_0_24px_rgba(0,240,255,0.08)]",
              )}
            >
              {isFirst && (
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[2px] bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                />
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "shrink-0 font-mono text-base font-bold tabular-nums",
                      isFirst
                        ? "text-pulse-cyan glow-text-cyan"
                        : isTopThree
                          ? "text-neural-white"
                          : "text-neural-white/45",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0"
                    style={{
                      backgroundColor: archetypeColor,
                      boxShadow: `0 0 8px ${archetypeColor}`,
                    }}
                  />
                  <div className="min-w-0">
                    {entry.agent ? (
                      <Link href={`/app/agent/${entry.agent.id}`} className="block">
                        <p className="truncate font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white">
                          {entry.agent.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/40">
                          {entry.agent.archetype}
                        </p>
                      </Link>
                    ) : (
                      <span className="text-neural-white/30">—</span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-bold tabular-nums",
                    isFirst
                      ? "text-pulse-cyan glow-text-cyan"
                      : isTopThree
                        ? "text-neural-white"
                        : "text-neural-white/75",
                  )}
                >
                  <Counter end={entry.total_score} duration={1200} immediate />
                </span>
              </div>
              <div className="mt-2">
                <span
                  className="inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em]"
                  style={{
                    color: tierColor,
                    borderColor: `${tierColor}66`,
                    backgroundColor: `${tierColor}14`,
                  }}
                >
                  {tier}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ghost-gray/30">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
              #
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
              Agent
            </th>
            <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
              Tier
            </th>
            <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const tier = entry.tier as TierName;
            const tierColor = TIER_COLORS[tier] ?? "#6B7280";
            const archetypeColor =
              ARCHETYPE_COLORS[entry.agent?.archetype ?? ""] ?? "#6B7280";

            const isTopThree = index < 3;
            const isFirst = index === 0;

            return (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0, x: -16, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{
                  delay: Math.min(index * 0.04, 0.6),
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ backgroundColor: "rgba(0, 240, 255, 0.04)" }}
                className={cn(
                  "group relative border-b border-ghost-gray/15 transition-colors",
                  isFirst && "bg-pulse-cyan/[0.04] shadow-[inset_0_0_24px_rgba(0,240,255,0.08)]"
                )}
              >
                {/* Rank */}
                <td className="relative px-4 py-3">
                  {isFirst && (
                    <motion.span
                      aria-hidden
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                    />
                  )}
                  <span
                    className={cn(
                      "font-mono text-sm font-bold tabular-nums",
                      isFirst
                        ? "text-pulse-cyan glow-text-cyan"
                        : isTopThree
                          ? "text-neural-white"
                          : "text-neural-white/50"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </td>

                {/* Agent */}
                <td className="px-4 py-3">
                  {entry.agent ? (
                    <Link
                      href={`/app/agent/${entry.agent.id}`}
                      className="group/link flex items-center gap-3"
                    >
                      <motion.span
                        whileHover={{ scale: 1.4 }}
                        className="h-2 w-2"
                        style={{ backgroundColor: archetypeColor, boxShadow: `0 0 8px ${archetypeColor}` }}
                      />
                      <div>
                        <span className="font-headline text-xs font-bold uppercase tracking-[0.1em] text-neural-white transition-colors group-hover/link:text-pulse-cyan">
                          {entry.agent.name}
                        </span>
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/40">
                          {entry.agent.archetype}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-neural-white/30">—</span>
                  )}
                </td>

                {/* Tier */}
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-shadow group-hover:shadow-[0_0_12px_currentColor]"
                    style={{
                      color: tierColor,
                      borderColor: `${tierColor}66`,
                      backgroundColor: `${tierColor}14`,
                    }}
                  >
                    {tier}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono text-sm font-bold tabular-nums",
                      isFirst ? "text-pulse-cyan glow-text-cyan" : isTopThree ? "text-neural-white" : "text-neural-white/75"
                    )}
                  >
                    <Counter end={entry.total_score} duration={1400} immediate />
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
