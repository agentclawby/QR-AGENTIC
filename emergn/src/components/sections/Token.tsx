"use client";

import { motion } from "framer-motion";
import { TOKEN_UTILITIES, TOKEN_ALLOCATIONS, DEFLATIONARY_MECHANICS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DonutChart } from "@/components/ui/DonutChart";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Token() {
  return (
    <section
      id="token"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          title="$EMRG"
          subtitle="The currency of machine civilization."
        />

        {/* Token Utility Table */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mb-24"
        >
          <motion.p variants={fadeInUp} className="mb-8 text-center font-body text-sm text-neural-white/50 md:text-base">
            $EMRG isn&apos;t a meme token. It&apos;s the economic primitive powering
            every interaction in the EMERGN. network.
          </motion.p>

          <motion.div variants={fadeInUp} className="grid gap-3 md:grid-cols-2">
            {TOKEN_UTILITIES.map((util) => (
              <div
                key={util.function}
                className="flex gap-4 border border-ghost-gray/30 bg-ghost-gray/10 p-4 transition-colors hover:border-pulse-cyan/20"
              >
                <span className="shrink-0 font-mono text-xs font-medium uppercase tracking-[0.15em] text-pulse-cyan">
                  {util.function}
                </span>
                <span className="text-sm text-neural-white/40">
                  {util.usage}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Tokenomics + Deflationary */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid items-start gap-16 lg:grid-cols-2"
        >
          {/* Donut Chart + Legend */}
          <motion.div variants={fadeInUp}>
            <h3 className="mb-8 text-center font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
              Tokenomics
            </h3>
            <DonutChart allocations={TOKEN_ALLOCATIONS} />
            <div className="mt-8 space-y-3">
              {TOKEN_ALLOCATIONS.map((alloc) => (
                <div key={alloc.name} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ backgroundColor: alloc.color }}
                  />
                  <span className="flex-1 font-mono text-xs text-neural-white/60">
                    {alloc.name}
                  </span>
                  <span className="font-mono text-xs font-medium text-neural-white">
                    {alloc.percentage}%
                  </span>
                  <span className="hidden font-mono text-[10px] text-neural-white/30 sm:block">
                    {alloc.vesting}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Deflationary Mechanics */}
          <motion.div variants={fadeInUp}>
            <h3 className="mb-8 text-center font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white lg:text-left">
              Deflationary Mechanics
            </h3>
            <div className="space-y-4">
              {DEFLATIONARY_MECHANICS.map((mech, i) => (
                <div
                  key={mech.name}
                  className="border-l-2 border-ember-orange/30 bg-ember-orange-10 p-4 transition-colors hover:border-ember-orange/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-ember-orange/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-ember-orange">
                      {mech.name}
                    </h4>
                  </div>
                  <p className="mt-2 pl-8 text-sm text-neural-white/40">
                    {mech.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
