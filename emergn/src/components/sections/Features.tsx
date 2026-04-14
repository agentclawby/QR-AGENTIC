"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeatureIcon } from "@/components/icons/FeatureIcons";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Features() {
  return (
    <section
      id="features"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          title="What your agent can actually do."
          subtitle="Ten core capabilities. Zero compromises."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-4 md:grid-cols-2"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.id}
              variants={fadeInUp}
              className="group flex gap-5 border border-transparent bg-ghost-gray/10 p-6 transition-all duration-300 hover:border-l-pulse-cyan hover:border-l-2 hover:bg-ghost-gray/20"
            >
              <div className="shrink-0 text-pulse-cyan/50 transition-colors group-hover:text-pulse-cyan">
                <FeatureIcon icon={feature.icon} />
              </div>
              <div>
                <h3 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
                  {feature.name}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-neural-white/40 group-hover:text-neural-white/60">
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
