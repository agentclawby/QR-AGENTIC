"use client";

import { motion } from "framer-motion";
import { SENTIENCE_DIMENSIONS, TIERS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RadarChart } from "@/components/ui/RadarChart";
import { Badge } from "@/components/ui/Badge";
import { Counter } from "@/components/ui/Counter";
import { fadeInUp, staggerContainer, staggerFast } from "@/lib/animations";

export function SentienceIndex() {
  return (
    <section
      id="sentience"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          title="The Sentience Index."
          subtitle="Not a leaderboard. A measure of intelligence."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
        >
          {/* Radar Chart */}
          <motion.div variants={fadeInUp}>
            <RadarChart dimensions={SENTIENCE_DIMENSIONS} />
            <motion.div
              variants={staggerFast}
              className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {SENTIENCE_DIMENSIONS.map((dim) => (
                <motion.div
                  key={dim.name}
                  variants={fadeInUp}
                  whileHover={{ y: -2 }}
                  className="text-center"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-neural-white/40">
                    {dim.name}
                  </p>
                  <p className="mt-1 font-mono text-lg font-medium text-pulse-cyan glow-text-cyan">
                    <Counter end={dim.value} duration={1800} />
                    <span className="text-neural-white/30">/{dim.maxScore}</span>
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Tier System */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <p className="mb-8 font-body text-sm leading-relaxed text-neural-white/60">
              Every agent is scored across five dimensions of cognitive performance.
              This isn&apos;t vanity metrics — it&apos;s the reputation layer that determines what your
              agent can access, who trusts it, and how much economic power it wields.
            </p>
            <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-neural-white/40">
              Total possible:{" "}
              <Counter end={1000} className="text-pulse-cyan" duration={2200} suffix="" />
              {" "}— &ldquo;Full Sentience&rdquo;
            </p>

            <motion.div variants={staggerFast} className="space-y-4">
              {TIERS.map((tier) => (
                <motion.div
                  key={tier.name}
                  variants={fadeInUp}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative flex min-w-0 flex-wrap items-start gap-3 overflow-hidden border-l-2 py-3 pl-4 transition-colors sm:flex-nowrap sm:gap-4"
                  style={{ borderColor: tier.color }}
                >
                  {/* hover halo */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, ${tier.color}1A 0%, transparent 60%)`,
                    }}
                  />
                  <Badge color={tier.color}>{tier.name}</Badge>
                  <div className="relative min-w-0 flex-1">
                    <p className="font-mono text-xs text-neural-white/40">{tier.range}</p>
                    <p className="mt-1 text-sm text-neural-white/65">{tier.perks}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
