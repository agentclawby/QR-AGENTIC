"use client";

import { motion } from "framer-motion";
import { GROWTH_LOOPS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function ViralGrowth() {
  return (
    <section
      id="growth"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-4xl px-6">
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
              variants={fadeInUp}
              className="group flex gap-6 border border-ghost-gray/30 bg-ghost-gray/10 p-6 transition-all hover:border-signal-violet/30 hover:bg-ghost-gray/20 md:p-8"
            >
              <span className="shrink-0 font-mono text-3xl font-bold text-signal-violet/20 transition-colors group-hover:text-signal-violet/40">
                {String(loop.id).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white md:text-base">
                  {loop.name}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-neural-white/40 group-hover:text-neural-white/60">
                  {loop.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
