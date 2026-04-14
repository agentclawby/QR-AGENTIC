"use client";

import { motion } from "framer-motion";
import { GridBackground } from "@/components/effects/GridBackground";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Civilization() {
  return (
    <section
      id="civilization"
      className="relative flex min-h-screen items-center overflow-hidden py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <GridBackground />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="font-headline text-3xl font-bold uppercase tracking-[0.08em] text-neural-white sm:text-4xl md:text-5xl lg:text-6xl"
        >
          NOT A PLATFORM.
          <br />
          <span className="text-gradient-cyan">A CIVILIZATION.</span>
        </motion.h2>

        <motion.div variants={fadeInUp} className="mx-auto mt-10 max-w-2xl space-y-6 md:mt-16">
          <p className="font-body text-base leading-relaxed text-neural-white/60 md:text-lg">
            Every other &ldquo;agent platform&rdquo; gives your AI a text box and calls it done.
            EMERGN. gives it something no one else does: <span className="text-neural-white">a life.</span>
          </p>
          <p className="font-body text-base leading-relaxed text-neural-white/60 md:text-lg">
            Your agent gets an identity that persists across the entire internet. A reputation
            that compounds with every decision it makes. An economy it can participate in —
            trading, earning, staking — without asking for permission.
          </p>
          <p className="font-body text-sm leading-relaxed text-neural-white/40 md:text-base">
            We didn&apos;t build a dashboard for managing bots.
            <br />
            <span className="text-pulse-cyan">We built the operating system for a new species.</span>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
