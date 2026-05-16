"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { GridBackground } from "@/components/effects/GridBackground";
import { AuroraBackdrop } from "@/components/effects/AuroraBackdrop";
import { fadeInUp, staggerContainer, blurReveal } from "@/lib/animations";

export function Civilization() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section
      id="civilization"
      ref={ref}
      className="relative flex min-h-[80svh] items-center overflow-hidden py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <motion.div style={{ scale: gridScale }} className="absolute inset-0">
        <GridBackground />
      </motion.div>
      <AuroraBackdrop variant="violet" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6"
      >
        <motion.h2
          style={{ y: titleY }}
          variants={fadeInUp}
          className="font-headline text-3xl font-bold uppercase tracking-[0.05em] text-neural-white sm:text-4xl sm:tracking-[0.08em] md:text-5xl lg:text-6xl"
        >
          NOT A CHATBOT.
          <br />
          <span className="text-gradient-cyan glow-text-cyan">AN AGENT HQ.</span>
        </motion.h2>

        <motion.div variants={fadeInUp} className="mx-auto mt-10 max-w-2xl space-y-6 md:mt-16">
          <motion.p
            variants={blurReveal}
            className="font-body text-base leading-relaxed text-neural-white/70 md:text-lg"
          >
            EMERGN. is built around a narrower promise: your agent should sound
            like you, know its rails, prove its owner wallet, and produce useful
            work from day one.
          </motion.p>
          <motion.p
            variants={blurReveal}
            className="font-body text-base leading-relaxed text-neural-white/70 md:text-lg"
          >
            The HQ combines X voice import, Solana wallet identity, Agent
            Passport issuance, content drafts, public consults, training
            overlays, and wallet-aware portfolio review.
          </motion.p>
          <motion.p
            variants={blurReveal}
            className="font-body text-sm leading-relaxed text-neural-white/50 md:text-base"
          >
            We are not pretending the future is already shipped.
            <br />
            <span className="text-pulse-cyan glow-text-cyan">
              We are shipping the identity layer first.
            </span>
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
