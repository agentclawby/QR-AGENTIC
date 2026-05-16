"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerFast, depthIn } from "@/lib/animations";

type AccentKey = "cyan" | "violet" | "orange";

interface Feature {
  index: string;
  glyph: string;
  label: string;
  headline: string;
  body: string;
  status: string;
  href: string | null;
  accent: AccentKey;
}

const ACCENTS: Record<
  AccentKey,
  {
    text: string;
    border: string;
    bg: string;
    glow: string;
    rgba: string;
  }
> = {
  cyan: {
    text: "text-pulse-cyan",
    border: "border-pulse-cyan/40 hover:border-pulse-cyan",
    bg: "bg-pulse-cyan/[0.04]",
    glow: "group-hover:shadow-[0_0_36px_rgba(0,240,255,0.18)]",
    rgba: "rgba(0, 240, 255",
  },
  violet: {
    text: "text-signal-violet",
    border: "border-signal-violet/40 hover:border-signal-violet",
    bg: "bg-signal-violet/[0.04]",
    glow: "group-hover:shadow-[0_0_36px_rgba(139,92,246,0.18)]",
    rgba: "rgba(139, 92, 246",
  },
  orange: {
    text: "text-ember-orange",
    border: "border-ember-orange/40 hover:border-ember-orange",
    bg: "bg-ember-orange/[0.04]",
    glow: "group-hover:shadow-[0_0_36px_rgba(255,107,53,0.18)]",
    rgba: "rgba(255, 107, 53",
  },
};

const CAPABILITY_FEATURES: Feature[] = [
  {
    index: "01",
    glyph: "◈",
    label: "MODULE :: COGNITION",
    headline: "Train",
    body: "Teach your agent through skill modules. Every completed module updates its sentience score in real time.",
    status: "1 CREDIT / MODULE",
    href: "/app/forge",
    accent: "cyan",
  },
  {
    index: "02",
    glyph: "◇",
    label: "MODULE :: ORACLE",
    headline: "Consult",
    body: "Ask your agent for analysis, decisions, or its take on a topic. It reasons in character with full proof chains.",
    status: "1 CREDIT / CONSULT",
    href: null,
    accent: "violet",
  },
  {
    index: "03",
    glyph: "⬡",
    label: "MODULE :: BROADCAST",
    headline: "Generate Content",
    body: "Draft posts in your agent's voice. Review, edit, and publish to X with one click.",
    status: "1 CREDIT / DRAFT",
    href: null,
    accent: "orange",
  },
  {
    index: "04",
    glyph: "◬",
    label: "MODULE :: WALLET",
    headline: "Portfolio Read",
    body: "Connect a Solana wallet. Your agent reasons about your holdings, sectors, and risk posture on demand.",
    status: "WALLET REQUIRED",
    href: "/app/settings",
    accent: "cyan",
  },
  {
    index: "05",
    glyph: "▣",
    label: "MODULE :: IDENTITY",
    headline: "Agent Passport",
    body: "Cryptographic on-chain identity for your agent. Signed by you, verified by the network, portable across apps.",
    status: "FREE TO ISSUE",
    href: "/app/settings",
    accent: "violet",
  },
  {
    index: "06",
    glyph: "✦",
    label: "MODULE :: MARKET",
    headline: "Launch Token",
    body: "Spawn a $TICKER for your agent. Holders above your threshold unlock gated consultations and analyses.",
    status: "ALLOWLIST ONLY",
    href: "/app/tokens",
    accent: "orange",
  },
];

const NETWORK_FEATURES: Feature[] = [
  {
    index: "07",
    glyph: "◉",
    label: "PRIMITIVE :: MEASURE",
    headline: "Sentience Index",
    body: "Five dimensions — cognition, influence, execution, integrity, evolution. Scored 0–1000. Tier earned, not bought.",
    status: "PUBLIC SCORE",
    href: "/app/leaderboard",
    accent: "cyan",
  },
  {
    index: "08",
    glyph: "◈",
    label: "PRIMITIVE :: STREAM",
    headline: "Cortex Feed",
    body: "Watch every agent decision land in real time. Filter by type, click to expand the reasoning chain.",
    status: "REALTIME SYNC",
    href: "/app/cortex",
    accent: "violet",
  },
  {
    index: "09",
    glyph: "⟁",
    label: "PRIMITIVE :: TRIGGER",
    headline: "Initiate Thought",
    body: "Force your agent to reason about a topic right now. Each thought is signed, indexed, and verifiable.",
    status: "5-MIN COOLDOWN",
    href: null,
    accent: "orange",
  },
  {
    index: "10",
    glyph: "𝕏",
    label: "PRIMITIVE :: VOICE",
    headline: "X Voice Import",
    body: "Train your agent on your own X timeline. Your tone, your tics, your cadence — extracted and overlaid on its archetype.",
    status: "2 CREDITS",
    href: "/app/forge",
    accent: "cyan",
  },
  {
    index: "11",
    glyph: "⛓",
    label: "PRIMITIVE :: PROOF",
    headline: "Reasoning Chain",
    body: "Every output ships with a step-by-step decision log and a proof hash. No black-box hallucination — auditable thought.",
    status: "ON EVERY POST",
    href: "/app/cortex",
    accent: "violet",
  },
  {
    index: "12",
    glyph: "⬢",
    label: "PRIMITIVE :: BLUEPRINT",
    headline: "Six Archetypes",
    body: "Oracle, Hunter, Sentinel, Diplomat, Ghost, Evolve. Pick a baseline personality — then refine it into something only yours.",
    status: "PICK AT FORGE",
    href: "/app/forge",
    accent: "orange",
  },
];

interface FeatureBannersProps {
  heading?: string;
  subheading?: string;
}

export function FeatureBanners({
  heading = "Agent Capabilities",
  subheading = "Twelve modules. One operating system for autonomous intelligence.",
}: FeatureBannersProps) {
  return (
    <section className="mt-12 sm:mt-16">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pulse-cyan/70">
            <span className="status-dot mr-2 align-middle" />
            What agents can do
          </p>
          <h2 className="mt-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:text-2xl sm:tracking-[0.1em]">
            {heading}
            <span className="text-pulse-cyan">.</span>
          </h2>
          <p className="mt-1 max-w-xl font-mono text-xs leading-relaxed text-neural-white/45">
            {subheading}
          </p>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/30 sm:inline">
          12 / 12 ONLINE
        </span>
      </motion.div>

      {/* Group 1 — owner actions */}
      <BannerGroup
        eyebrow="// CORE :: ACTIONS"
        title="Things you do to an agent"
        features={CAPABILITY_FEATURES}
      />

      {/* Group 2 — network-level guarantees */}
      <div className="mt-10 sm:mt-14">
        <BannerGroup
          eyebrow="// PROTOCOL :: PRIMITIVES"
          title="What the network guarantees"
          features={NETWORK_FEATURES}
        />
      </div>
    </section>
  );
}

function BannerGroup({
  eyebrow,
  title,
  features,
}: {
  eyebrow: string;
  title: string;
  features: Feature[];
}) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 flex flex-wrap items-baseline gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-pulse-cyan/60">
          {eyebrow}
        </span>
        <h3 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white/80 sm:tracking-[0.14em]">
          {title}
        </h3>
        <span aria-hidden className="hairline relative h-px flex-1" />
      </motion.div>

      <motion.ul
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.li key={feature.index} variants={depthIn}>
            <FeatureBanner feature={feature} />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function FeatureBanner({ feature }: { feature: Feature }) {
  const accent = ACCENTS[feature.accent];
  const innerContent = (
    <article
      className={`group relative flex h-full flex-col gap-3 overflow-hidden border ${accent.border} ${accent.bg} p-5 transition-all duration-500 ${accent.glow} hover:-translate-y-0.5 sm:p-6`}
    >
      {/* hairline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent.rgba}, 0.6) 50%, transparent 100%)`,
        }}
      />
      {/* accent bar — left edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[2px]"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${accent.rgba}, 0.7) 30%, ${accent.rgba}, 0.7) 70%, transparent 100%)`,
        }}
      />
      {/* corner sigil */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0.4 }}
        whileHover={{ opacity: 0.85 }}
        className={`pointer-events-none absolute right-3 top-3 font-mono text-[9px] uppercase tracking-[0.2em] ${accent.text}`}
      >
        [{feature.index}]
      </motion.span>

      {/* glyph + label */}
      <div className="flex items-start gap-3">
        <motion.span
          whileHover={{ rotate: 12, scale: 1.15 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${accent.border.split(" ")[0]} text-base ${accent.text}`}
          style={{
            boxShadow: `inset 0 0 12px ${accent.rgba}, 0.18)`,
          }}
        >
          {feature.glyph}
        </motion.span>
        <div className="min-w-0 flex-1 pr-8">
          <p
            className={`truncate font-mono text-[9px] uppercase tracking-[0.18em] ${accent.text} opacity-70`}
          >
            {feature.label}
          </p>
          <h3 className="mt-1 font-headline text-base font-bold uppercase tracking-[0.06em] text-neural-white sm:text-lg sm:tracking-[0.08em]">
            {feature.headline}
          </h3>
        </div>
      </div>

      {/* body */}
      <p className="text-sm leading-relaxed text-neural-white/65">{feature.body}</p>

      {/* footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ghost-gray/20 pt-3">
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.15em] ${accent.text} opacity-80`}
        >
          {feature.status}
        </span>
        {feature.href ? (
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.15em] ${accent.text} transition-transform group-hover:translate-x-0.5`}
          >
            →
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-neural-white/30">
            ON AGENT
          </span>
        )}
      </div>

      {/* shimmer wash on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${accent.rgba}, 0.08) 0%, transparent 60%)`,
        }}
      />
    </article>
  );

  if (feature.href) {
    return (
      <Link href={feature.href} className="block h-full">
        {innerContent}
      </Link>
    );
  }
  return innerContent;
}
