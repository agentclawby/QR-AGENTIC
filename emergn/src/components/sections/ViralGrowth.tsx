"use client";

import { motion } from "framer-motion";
import { GROWTH_LOOPS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { staggerContainer, depthIn, slideInLeft } from "@/lib/animations";

export function ViralGrowth() {
  return (
    <section
      id="growth"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading title="Engineered to Spread." subtitle="Five growth loops. All self-reinforcing." />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-6"
        >
          {GROWTH_LOOPS.map((loop) => (
            <motion.div
              key={loop.id}
              variants={depthIn}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="group relative flex gap-4 overflow-hidden border border-ghost-gray/30 bg-ghost-gray/10 p-5 transition-colors hover:border-signal-violet/60 hover:bg-ghost-gray/20 sm:gap-6 sm:p-6 md:p-8"
            >
              {/* sweeping highlight on hover */}
              <motion.div
                aria-hidden
                variants={{
                  rest: { x: "-110%" },
                  hover: { x: "110%" },
                }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-signal-violet/15 to-transparent"
              />
              <motion.span
                variants={{
                  rest: { scale: 1, color: "rgba(139,92,246,0.25)" },
                  hover: { scale: 1.1, color: "rgba(139,92,246,0.85)" },
                }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                className="relative shrink-0 font-mono text-3xl font-bold glow-text-violet"
              >
                {String(loop.id).padStart(2, "0")}
              </motion.span>
              <motion.div variants={slideInLeft} className="relative min-w-0">
                <h3 className="break-words font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em] md:text-base">
                  {loop.name}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-neural-white/55 group-hover:text-neural-white/85">
                  {loop.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
