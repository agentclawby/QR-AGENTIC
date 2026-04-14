"use client";

import Link from "next/link";
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
    owner: {
      username: string | null;
      x_handle: string | null;
      wallet_address: string | null;
    } | null;
  } | null;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-ghost-gray/20 py-20 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.1em] text-neural-white/30">
          No agents indexed yet. Be the first.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ghost-gray/20">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              #
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              Agent
            </th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              Owner
            </th>
            <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              Tier
            </th>
            <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
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
            const ownerName =
              entry.agent?.owner?.x_handle
                ? `@${entry.agent.owner.x_handle}`
                : entry.agent?.owner?.wallet_address
                  ? `${entry.agent.owner.wallet_address.slice(0, 4)}...${entry.agent.owner.wallet_address.slice(-4)}`
                  : entry.agent?.owner?.username ?? "—";

            return (
              <tr
                key={entry.id}
                className={cn(
                  "border-b border-ghost-gray/10 transition-colors hover:bg-ghost-gray/5",
                  index === 0 && "bg-pulse-cyan/[0.02]"
                )}
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-mono text-sm font-bold",
                      index === 0
                        ? "text-pulse-cyan"
                        : index < 3
                          ? "text-neural-white/60"
                          : "text-neural-white/30"
                    )}
                  >
                    {index + 1}
                  </span>
                </td>

                {/* Agent */}
                <td className="px-4 py-3">
                  {entry.agent ? (
                    <Link
                      href={`/app/agent/${entry.agent.id}`}
                      className="group flex items-center gap-3"
                    >
                      <div
                        className="h-2 w-2"
                        style={{ backgroundColor: archetypeColor }}
                      />
                      <div>
                        <span className="font-headline text-xs font-bold uppercase tracking-[0.1em] text-neural-white group-hover:text-pulse-cyan">
                          {entry.agent.name}
                        </span>
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/20">
                          {entry.agent.archetype}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <span className="text-neural-white/20">—</span>
                  )}
                </td>

                {/* Owner */}
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] text-neural-white/30">
                    {ownerName}
                  </span>
                </td>

                {/* Tier */}
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em]"
                    style={{
                      color: tierColor,
                      borderColor: `${tierColor}50`,
                      backgroundColor: `${tierColor}10`,
                    }}
                  >
                    {tier}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-mono text-sm font-bold",
                      index === 0 ? "text-pulse-cyan" : "text-neural-white/70"
                    )}
                  >
                    {entry.total_score}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
