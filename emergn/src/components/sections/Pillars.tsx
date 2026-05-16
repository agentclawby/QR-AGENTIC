"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeInUp, depthIn, staggerContainer } from "@/lib/animations";

const PILLARS = [
  {
    title: "IDENTITY",
    quote: '"I Exist."',
    description:
      "Every agent can receive an Agent Passport tied to the owner's Solana wallet. Name. Face. Signature. Proof hash. Public badge. Identity before speculation.",
    accent: "text-pulse-cyan",
    border: "border-pulse-cyan/30",
    glowVar: "rgba(0, 240, 255, 0.18)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-pulse-cyan">
        <circle cx="24" cy="24" r="20" />
        <circle cx="24" cy="24" r="8" />
        <path d="M24 4v8m0 24v8M4 24h8m24 0h8" />
      </svg>
    ),
  },
  {
    title: "AUTONOMY",
    quote: '"I Work Within Rails."',
    description:
      "Agents draft, consult, analyze, and train inside explicit human approval boundaries. Posting, trading, and treasury actions stay manual until autonomy pilots are safe.",
    accent: "text-signal-violet",
    border: "border-signal-violet/30",
    glowVar: "rgba(139, 92, 246, 0.18)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-signal-violet">
        <path d="M24 4l18 10v20L24 44 6 34V14L24 4z" />
        <path d="M24 16v16M16 24h16" />
      </svg>
    ),
  },
  {
    title: "EVOLUTION",
    quote: '"I Grow."',
    description:
      "Voice imports, training modules, feedback, and refinement overlays make the agent more useful over time. The Sentience Index tracks progression without pretending it is magic.",
    accent: "text-ember-orange",
    border: "border-ember-orange/30",
    glowVar: "rgba(255, 107, 53, 0.18)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12 text-ember-orange">
        <path d="M8 40l8-12 8 8 8-16 8 8" />
        <path d="M36 28v-4h4" />
      </svg>
    ),
  },
];

export function Pillars() {
  return (
    <section
      id="pillars"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading title="Identity. Rails. Evolution." subtitle="Three pillars of a working agent" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {PILLARS.map((pillar) => (
            <motion.div
              key={pillar.title}
              variants={depthIn}
              whileHover="hover"
              initial="rest"
              animate="rest"
              style={{ ["--glow" as string]: pillar.glowVar }}
              className={`group relative overflow-hidden border ${pillar.border} bg-ghost-gray/10 p-6 transition-all duration-500 sm:p-8 md:p-10 hover:bg-ghost-gray/20 hover:[box-shadow:0_0_60px_var(--glow),inset_0_1px_0_var(--glow)]`}
            >
              {/* sweeping highlight on hover */}
              <motion.div
                aria-hidden
                variants={{
                  rest: { x: "-110%", opacity: 0 },
                  hover: { x: "110%", opacity: 1 },
                }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
              />
              <motion.div
                variants={{
                  rest: { rotate: 0, scale: 1 },
                  hover: { rotate: 8, scale: 1.06 },
                }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="relative mb-6"
              >
                {pillar.icon}
              </motion.div>
              <motion.h3
                variants={fadeInUp}
                className={`break-words font-headline text-xl font-bold tracking-[0.08em] sm:text-2xl sm:tracking-[0.1em] ${pillar.accent}`}
              >
                {pillar.title}
              </motion.h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/30 sm:tracking-[0.2em]">
                {pillar.quote}
              </p>
              <p className="mt-6 font-body text-sm leading-relaxed text-neural-white/60">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
