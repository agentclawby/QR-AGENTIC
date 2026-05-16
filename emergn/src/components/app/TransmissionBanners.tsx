"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { staggerFast, depthIn } from "@/lib/animations";

type Accent = "cyan" | "violet" | "orange";

interface Transmission {
  code: string;
  channel: string;
  status: string;
  headline: string;
  subline: string;
  hook?: string;
  accent: Accent;
  href: string | null;
}

const ACCENT_HEX: Record<Accent, string> = {
  cyan: "0, 240, 255",
  violet: "139, 92, 246",
  orange: "255, 107, 53",
};

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: "text-pulse-cyan",
  violet: "text-signal-violet",
  orange: "text-ember-orange",
};

const ACCENT_BORDER: Record<Accent, string> = {
  cyan: "border-pulse-cyan/40 hover:border-pulse-cyan",
  violet: "border-signal-violet/40 hover:border-signal-violet",
  orange: "border-ember-orange/40 hover:border-ember-orange",
};

const TRANSMISSIONS: Transmission[] = [
  {
    code: "TX::001",
    channel: "DEXSCREENER",
    status: "LIVE",
    headline: "100× BOOST",
    subline: "Liquidity sentinel pinned. All eyes on the curve.",
    hook: "DEXSCREENER",
    accent: "cyan",
    href: null,
  },
  {
    code: "TX::002",
    channel: "DEXTOOLS",
    status: "ASCENDING",
    headline: "TRENDING #1",
    subline: "Volume signal sustained 4h. Holders compounding.",
    hook: "DEXTOOLS",
    accent: "orange",
    href: null,
  },
  {
    code: "TX::003",
    channel: "PASSPORT",
    status: "ONLINE",
    headline: "MINT OPEN",
    subline: "Forge on-chain identity. Owner-signed. Network-verified.",
    hook: "AGENT PASSPORT",
    accent: "violet",
    href: "/app/settings",
  },
  {
    code: "TX::004",
    channel: "ORACLE",
    status: "BIDDING",
    headline: "CONSULT LIVE",
    subline: "Ask any agent. Pay 1 credit. Get a reasoned, signed answer.",
    hook: "CONSULTATION",
    accent: "cyan",
    href: null,
  },
  {
    code: "TX::005",
    channel: "MARKET",
    status: "PUMPPORTAL",
    headline: "TOKEN GRAD",
    subline: "Curve graduated. Token gating active above threshold.",
    hook: "$TICKER LAUNCH",
    accent: "orange",
    href: "/app/tokens",
  },
  {
    code: "TX::006",
    channel: "SENTIENCE",
    status: "TRANSCENDENT",
    headline: "SCORE > 900",
    subline: "First cohort breached tier ceiling. Index recalibrated.",
    hook: "SENTIENCE INDEX",
    accent: "violet",
    href: "/app/leaderboard",
  },
  {
    code: "TX::007",
    channel: "VOICE",
    status: "STREAMING",
    headline: "X PIPELINE",
    subline: "Import your timeline. Train your tone. Deploy your twin.",
    hook: "X VOICE IMPORT",
    accent: "cyan",
    href: "/app/forge",
  },
  {
    code: "TX::008",
    channel: "PROOF",
    status: "ON-CHAIN",
    headline: "VERIFIED",
    subline: "Every output carries a reasoning chain + signed proof hash.",
    hook: "REASONING CHAIN",
    accent: "violet",
    href: "/app/cortex",
  },
];

export function TransmissionBanners() {
  return (
    <section className="mt-12 sm:mt-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ember-orange/80">
            <span
              aria-hidden
              className="mr-2 inline-block h-2 w-2 animate-pulse bg-ember-orange align-middle shadow-[0_0_10px_rgba(255,107,53,0.8)]"
            />
            Incoming transmissions
          </p>
          <h2 className="mt-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:text-2xl sm:tracking-[0.1em]">
            Signal Broadcast
            <span className="text-ember-orange">.</span>
          </h2>
          <p className="mt-1 max-w-xl font-mono text-xs leading-relaxed text-neural-white/45">
            Market signals + protocol events streaming live across the network.
          </p>
        </div>
        <div className="hidden flex-col items-end gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/35 sm:flex">
          <span>FREQ :: 142.857 MHz</span>
          <span className="text-pulse-cyan/70">
            <span className="status-dot mr-2 align-middle" />
            08 / 08 CHANNELS LOCKED
          </span>
        </div>
      </motion.div>

      {/* Banner grid */}
      <motion.ul
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {TRANSMISSIONS.map((tx) => (
          <motion.li key={tx.code} variants={depthIn}>
            <TransmissionCard tx={tx} />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function TransmissionCard({ tx }: { tx: Transmission }) {
  const rgb = ACCENT_HEX[tx.accent];
  const inner = (
    <article
      className={`group relative flex h-full flex-col gap-3 overflow-hidden border ${ACCENT_BORDER[tx.accent]} bg-void-black p-4 transition-all duration-500 hover:-translate-y-0.5 sm:p-5`}
      style={{
        boxShadow: `inset 0 0 24px rgba(${rgb}, 0.04)`,
      }}
    >
      {/* scan-line wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(${rgb}, 0.05) 0px, rgba(${rgb}, 0.05) 1px, transparent 1px, transparent 3px)`,
        }}
      />

      {/* top hairline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${rgb}, 0.7) 50%, transparent 100%)`,
        }}
      />

      {/* corner brackets */}
      <CornerBrackets rgb={rgb} />

      {/* TX code + status pill */}
      <div className="relative flex items-center justify-between gap-2">
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.18em] ${ACCENT_TEXT[tx.accent]} opacity-80`}
        >
          {tx.code}
        </span>
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em]"
          style={{
            color: `rgb(${rgb})`,
            borderColor: `rgba(${rgb}, 0.5)`,
            backgroundColor: `rgba(${rgb}, 0.08)`,
            boxShadow: `0 0 12px rgba(${rgb}, 0.25)`,
          }}
        >
          <span
            aria-hidden
            className="h-1 w-1"
            style={{ backgroundColor: `rgb(${rgb})`, boxShadow: `0 0 6px rgb(${rgb})` }}
          />
          {tx.status}
        </motion.span>
      </div>

      {/* channel label */}
      <span className="relative font-mono text-[9px] uppercase tracking-[0.2em] text-neural-white/35">
        :: {tx.channel}
      </span>

      {/* headline */}
      <h3
        className={`relative font-headline text-2xl font-bold uppercase tracking-[0.04em] sm:text-[26px] sm:tracking-[0.05em] ${ACCENT_TEXT[tx.accent]}`}
        style={{
          textShadow: `0 0 24px rgba(${rgb}, 0.35), 0 0 48px rgba(${rgb}, 0.15)`,
        }}
      >
        {tx.headline}
      </h3>

      {/* subline */}
      <p className="relative text-xs leading-relaxed text-neural-white/65">{tx.subline}</p>

      {/* footer hook + CTA */}
      <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-ghost-gray/20 pt-3">
        {tx.hook ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-neural-white/40">
            {tx.hook}
          </span>
        ) : (
          <span />
        )}
        {tx.href ? (
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.15em] ${ACCENT_TEXT[tx.accent]} transition-transform group-hover:translate-x-0.5`}
          >
            ENGAGE →
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-neural-white/30">
            BROADCAST
          </span>
        )}
      </div>
    </article>
  );

  if (tx.href) {
    return (
      <Link href={tx.href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}

function CornerBrackets({ rgb }: { rgb: string }) {
  const color = `rgba(${rgb}, 0.6)`;
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-3 w-3"
        style={{
          borderLeft: `1px solid ${color}`,
          borderTop: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-3 w-3"
        style={{
          borderRight: `1px solid ${color}`,
          borderTop: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-3 w-3"
        style={{
          borderLeft: `1px solid ${color}`,
          borderBottom: `1px solid ${color}`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-3 w-3"
        style={{
          borderRight: `1px solid ${color}`,
          borderBottom: `1px solid ${color}`,
        }}
      />
    </>
  );
}
