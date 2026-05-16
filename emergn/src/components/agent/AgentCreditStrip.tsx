"use client";

import { motion } from "framer-motion";
import type { TierName, UserCreditBalance } from "@/types";

interface AgentCreditStripProps {
  credits: UserCreditBalance | null;
  tier: TierName;
  isOwner: boolean;
}

interface PillProps {
  label: string;
  value: string;
  hint: string;
  emphasize?: boolean;
}

function Pill({ label, value, hint, emphasize }: PillProps) {
  return (
    <div
      title={hint}
      className={
        emphasize
          ? "flex min-w-0 items-center gap-2 border border-pulse-cyan/30 bg-pulse-cyan/5 px-3 py-2"
          : "flex min-w-0 items-center gap-2 border border-ghost-gray/25 bg-void-black px-3 py-2"
      }
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-neural-white/40 sm:tracking-[0.18em]">
        {label}
      </span>
      <span
        className={
          emphasize
            ? "min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]"
            : "min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-neural-white/80 sm:tracking-[0.12em]"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function AgentCreditStrip({
  credits,
  tier,
  isOwner,
}: AgentCreditStripProps) {
  const earnedToday = credits?.action_credits_earned_today ?? 0;
  // Pre-migration fallback: sum legacy pools so the strip stays honest.
  const totalCredits =
    (credits?.action_credits ?? 0) > 0
      ? (credits?.action_credits ?? 0)
      : (credits?.training_credits ?? 0) +
        (credits?.premium_credits ?? 0) +
        (credits?.free_consults_remaining ?? 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-center gap-2"
    >
      <Pill
        label="Tier"
        value={tier}
        hint="Sentience tier — increases as the agent trains and acts."
        emphasize
      />
      <Pill
        label="Credits"
        value={`${totalCredits}`}
        hint="1 credit = 1 train / consult / content draft. X-retrain costs 2."
        emphasize
      />
      {isOwner ? (
        <Pill
          label="Earned today"
          value={`${earnedToday} / 3`}
          hint="Earn-by-posting cap. Publish a draft to X and verify the URL to add a credit."
        />
      ) : null}
      <span
        className="ml-auto hidden font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/30 sm:inline"
        title="Credits are included with your account during launch."
      >
        Trial active
      </span>
    </motion.div>
  );
}
