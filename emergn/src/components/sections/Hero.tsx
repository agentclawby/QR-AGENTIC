"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";
import { ScanlineOverlay } from "@/components/effects/ScanlineOverlay";
import { GlitchText } from "@/components/effects/GlitchText";
import { AuroraBackdrop } from "@/components/effects/AuroraBackdrop";
import { Button } from "@/components/ui/Button";
import { fadeInUp, staggerContainer, blurReveal } from "@/lib/animations";

const ParticleField = dynamic(
  () => import("@/components/effects/ParticleField").then((m) => ({ default: m.ParticleField })),
  {
    ssr: false,
    loading: () => null,
  }
);

function ClientOnlyParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <ParticleField />
    </Suspense>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const fieldY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pb-24 pt-32 sm:pb-28 sm:pt-36"
    >
      {/* Layer 0: Aurora gradient atmosphere */}
      <AuroraBackdrop fixed variant="default" />

      {/* Layer 1: Particles with scroll parallax */}
      <motion.div style={{ y: fieldY }} className="absolute inset-0">
        <ClientOnlyParticles />
      </motion.div>

      {/* Layer 2: Scanlines */}
      <ScanlineOverlay />

      {/* Layer 3: Vignette + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,15,0.85)_85%)]"
      />

      {/* Layer 4: Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale: titleScale }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-20 mx-auto max-w-5xl px-4 text-center sm:px-6"
      >
        <motion.p
          variants={fadeInUp}
          className="mb-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-pulse-cyan/70 sm:mb-6 sm:tracking-[0.4em]"
        >
          <span className="status-dot mr-2 align-middle" />
          Live — Solana identity agents initializing
        </motion.p>

        <motion.div variants={fadeInUp}>
          <GlitchText
            as="h1"
            className="font-headline text-3xl font-bold uppercase tracking-[0.04em] text-neural-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
          >
            YOUR AGENT NEEDS AN IDENTITY.
          </GlitchText>
        </motion.div>

        <motion.p
          variants={blurReveal}
          className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-neural-white/60 sm:text-lg md:mt-8 md:text-xl"
        >
          Create an agent from your X voice, bind it to a Solana wallet,
          <br className="hidden sm:block" />
          issue its passport, then put it to work. <span className="text-neural-white/90">Human-approved. Onchain-aware.</span>
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:mt-12"
        >
          <Button variant="primary" size="lg" href="#features" className="w-full sm:w-auto">
            Initialize an Agent
          </Button>
          <Button variant="secondary" size="lg" href="#civilization" className="w-full sm:w-auto">
            See How It Works
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute inset-x-0 bottom-6 z-20 hidden flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-neural-white/40 sm:flex"
      >
        <span>Scroll</span>
        <motion.span
          aria-hidden
          className="block h-8 w-px bg-gradient-to-b from-pulse-cyan/0 via-pulse-cyan to-pulse-cyan/0"
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-void-black to-transparent" />
    </section>
  );
}
