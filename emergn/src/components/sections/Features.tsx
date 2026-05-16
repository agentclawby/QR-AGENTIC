"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeatureIcon } from "@/components/icons/FeatureIcons";
import { fadeInUpSoft, staggerFast } from "@/lib/animations";

export function Features() {
  return (
    <section
      id="features"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          title="What your agent can actually do."
          subtitle="Utility, Solana identity, and onchain expansion."
        />

        <motion.div
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-4 md:grid-cols-2"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeInUpSoft}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="group relative flex gap-4 overflow-hidden border border-transparent bg-ghost-gray/10 p-5 transition-all duration-300 hover:border-ghost-gray hover:bg-ghost-gray/20 sm:gap-5 sm:p-6"
            >
              {/* Animated left accent */}
              <motion.span
                aria-hidden
                variants={{
                  rest: { scaleY: 0 },
                  hover: { scaleY: 1 },
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "top" }}
                className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-pulse-cyan via-signal-violet to-pulse-cyan"
              />
              {/* Hover glow halo */}
              <motion.span
                aria-hidden
                variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                transition={{ duration: 0.4 }}
                className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_0%_50%,rgba(0,240,255,0.10),transparent_70%)]"
              />

              <motion.div
                variants={{
                  rest: { rotate: 0, scale: 1 },
                  hover: { rotate: -6, scale: 1.08 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="relative shrink-0 text-pulse-cyan/60 transition-colors group-hover:text-pulse-cyan"
              >
                <FeatureIcon icon={feature.icon} />
              </motion.div>
              <div className="relative min-w-0">
                <h3 className="break-words font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
                  {feature.name}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-neural-white/50 transition-colors group-hover:text-neural-white/75">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
