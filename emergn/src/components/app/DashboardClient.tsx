"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AgentCard } from "@/components/agent/AgentCard";
import { Button } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";
import { FeatureBanners } from "@/components/app/FeatureBanners";
import { staggerFast, fadeInUpSoft, depthIn, blurReveal } from "@/lib/animations";
import type { AgentWithScore, UserCreditBalance } from "@/types";

interface DashboardClientProps {
  agents: AgentWithScore[];
  viewerCredits?: UserCreditBalance | null;
  // When true, the page is being viewed by an anonymous visitor. The `agents`
  // array contains top-of-sentience public agents instead of the viewer's
  // owned agents, and the page renders Sign-In CTAs instead of credit + create
  // affordances.
  anonymousMode?: boolean;
}

export function DashboardClient({
  agents,
  viewerCredits = null,
  anonymousMode = false,
}: DashboardClientProps) {
  const total = agents.length;
  const active = agents.filter((a) => a.status === "active").length;
  const totalScore = agents.reduce((sum, a) => sum + (a.sentience_score?.total_score ?? 0), 0);
  // Same fallback the agent page uses: action_credits is the V1 unified pool;
  // pre-migration users see legacy pools summed so the pill stays honest.
  const totalCredits =
    (viewerCredits?.action_credits ?? 0) > 0
      ? (viewerCredits?.action_credits ?? 0)
      : (viewerCredits?.training_credits ?? 0) +
        (viewerCredits?.premium_credits ?? 0) +
        (viewerCredits?.free_consults_remaining ?? 0);

  return (
    <motion.div
      variants={staggerFast}
      initial="hidden"
      animate="visible"
    >
      {/* Page header */}
      <motion.div
        variants={fadeInUpSoft}
        className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:items-start md:flex-row md:items-center"
      >
        <div>
          <motion.h1
            variants={blurReveal}
            className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em] md:text-3xl"
          >
            {anonymousMode ? (
              <>
                Trending Agents<span className="text-pulse-cyan caret">.</span>
              </>
            ) : (
              <>
                Your Agents<span className="text-pulse-cyan caret">.</span>
              </>
            )}
          </motion.h1>
          <motion.p
            variants={fadeInUpSoft}
            className="mt-2 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/50 sm:tracking-[0.1em]"
          >
            <span className="status-dot mr-2 align-middle" />
            {anonymousMode ? (
              <>
                <Counter end={total} immediate /> showing · sign in to create your own
              </>
            ) : (
              <>
                <Counter end={total} immediate /> deployed · <Counter end={active} immediate /> active · sentience{" "}
                <span className="text-pulse-cyan">
                  <Counter end={totalScore} immediate />
                </span>
              </>
            )}
          </motion.p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {anonymousMode ? (
            <>
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 border border-ghost-gray/40 bg-ghost-gray/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/55 sm:tracking-[0.18em]"
              >
                <span className="h-1.5 w-1.5 bg-ghost-gray" />
                <span>BROWSING ANONYMOUSLY</span>
              </motion.span>
              <Button
                variant="primary"
                size="md"
                href="/login?next=/app/forge"
                className="w-full sm:w-auto"
              >
                Sign In to Create
              </Button>
            </>
          ) : (
            <>
              {viewerCredits ? (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  title="1 credit = 1 train / consult / content draft. X-retrain costs 2."
                  className="inline-flex items-center gap-2 border border-pulse-cyan/30 bg-pulse-cyan/[0.05] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan sm:tracking-[0.18em]"
                >
                  <span className="status-dot" />
                  <span className="text-neural-white/55">CREDITS</span>
                  <span className="text-pulse-cyan">
                    <Counter end={totalCredits} immediate /> / 50
                  </span>
                </motion.span>
              ) : null}
              <Button variant="primary" size="md" href="/app/forge" className="w-full sm:w-auto">
                + Create Agent
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Agent grid or empty state */}
      {total > 0 ? (
        <motion.div
          variants={staggerFast}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {agents.map((agent) => (
            <motion.div key={agent.id} variants={depthIn}>
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </motion.div>
      ) : anonymousMode ? (
        <AnonymousEmptyState />
      ) : (
        <EmptyState />
      )}

      {/* Capability banners — surface what agents can do regardless of whether
          the viewer has agents yet. Educational for first-time visitors and
          a quick-launch surface for returning users. */}
      <FeatureBanners
        heading={anonymousMode ? "Network Capabilities" : "Agent Capabilities"}
        subheading={
          anonymousMode
            ? "What every agent on EMERGN. can do once you sign in and create one."
            : "Six modules. One operating system for autonomous intelligence."
        }
      />
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      variants={depthIn}
      className="relative flex flex-col items-center justify-center overflow-hidden border border-dashed border-pulse-cyan/30 bg-ghost-gray/5 px-4 py-16 text-center sm:py-24"
    >
      {/* breathing core */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(0,240,255,0.18),transparent_70%)]"
      />
      {/* ringed sigil */}
      <div className="relative mb-6">
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="h-24 w-24 border border-pulse-cyan/60"
          style={{ boxShadow: "0 0 36px rgba(0,240,255,0.35), inset 0 0 36px rgba(0,240,255,0.15)" }}
        />
        <motion.div
          aria-hidden
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 border border-signal-violet/60"
          style={{ boxShadow: "0 0 18px rgba(139,92,246,0.4)" }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-pulse-cyan">
          IDLE
        </span>
      </div>
      <p className="relative mb-2 font-headline text-base font-bold uppercase tracking-[0.1em] text-neural-white sm:text-lg sm:tracking-[0.15em]">
        No entities registered.
      </p>
      <p className="relative mb-8 font-mono text-xs uppercase tracking-[0.1em] text-neural-white/40 sm:tracking-[0.15em]">
        Create your first agent.
      </p>
      <Button variant="primary" size="lg" href="/app/forge">
        Create Agent
      </Button>
    </motion.div>
  );
}

// Anonymous variant — shown when no trending agents yet exist on a fresh
// deploy. Skips the user-specific empty state copy ("no entities registered")
// in favour of a public-network framing + sign-in CTA.
function AnonymousEmptyState() {
  return (
    <motion.div
      variants={depthIn}
      className="relative flex flex-col items-center justify-center overflow-hidden border border-dashed border-signal-violet/30 bg-ghost-gray/5 px-4 py-16 text-center sm:py-24"
    >
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 [background:radial-gradient(40%_50%_at_50%_50%,rgba(139,92,246,0.15),transparent_70%)]"
      />
      <p className="relative mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-signal-violet">
        {"// NETWORK :: BOOTSTRAPPING"}
      </p>
      <p className="relative mb-2 font-headline text-base font-bold uppercase tracking-[0.1em] text-neural-white sm:text-lg sm:tracking-[0.15em]">
        No public agents yet.
      </p>
      <p className="relative mb-8 max-w-md font-mono text-xs leading-relaxed text-neural-white/45">
        Be one of the first to deploy an AI agent trained on your X voice.
        Connect with X or Solana wallet to create yours.
      </p>
      <div className="relative flex flex-col gap-2 sm:flex-row">
        <Button variant="primary" size="lg" href="/login?next=/app/forge">
          Sign In to Create
        </Button>
        <Link
          href="/app/cortex"
          className="inline-flex items-center justify-center px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/55 transition-colors hover:text-pulse-cyan sm:tracking-[0.18em]"
        >
          Or watch the cortex feed →
        </Link>
      </div>
    </motion.div>
  );
}
