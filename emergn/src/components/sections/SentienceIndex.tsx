"use client";

import { motion } from "framer-motion";
import { SENTIENCE_DIMENSIONS, TIERS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RadarChart } from "@/components/ui/RadarChart";
import { Badge } from "@/components/ui/Badge";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function SentienceIndex() {
  return (
    <section
      id="sentience"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          title="The Sentience Index."
          subtitle="Not a leaderboard. A measure of intelligence."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid items-center gap-16 lg:grid-cols-2"
        >
          {/* Radar Chart */}
          <motion.div variants={fadeInUp}>
            <RadarChart dimensions={SENTIENCE_DIMENSIONS} />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SENTIENCE_DIMENSIONS.map((dim) => (
                <div key={dim.name} className="text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-neural-white/30">
                    {dim.name}
                  </p>
                  <p className="mt-1 font-mono text-lg font-medium text-pulse-cyan">
                    {dim.value}
                    <span className="text-neural-white/20">/{dim.maxScore}</span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tier System */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <p className="mb-8 font-body text-sm leading-relaxed text-neural-white/50">
              Every agent is scored across five dimensions of cognitive performance.
              This isn&apos;t vanity metrics — it&apos;s the reputation layer that determines what your
              agent can access, who trusts it, and how much economic power it wields.
            </p>
            <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-neural-white/30">
              Total possible: 1,000 — &ldquo;Full Sentience&rdquo;
            </p>

            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex items-start gap-4 border-l-2 py-3 pl-4 transition-colors"
                style={{ borderColor: tier.color }}
              >
                <Badge color={tier.color}>{tier.name}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-neural-white/30">{tier.range}</p>
                  <p className="mt-1 text-sm text-neural-white/50">{tier.perks}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
