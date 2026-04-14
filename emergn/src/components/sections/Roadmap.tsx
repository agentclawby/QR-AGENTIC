"use client";

import { motion } from "framer-motion";
import { ROADMAP_PHASES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const STATUS_COLORS = {
  completed: "#00F0FF",
  active: "#8B5CF6",
  upcoming: "#2A2A35",
};

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading title="Roadmap." subtitle="From signal to sovereignty." />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-ghost-gray/30 md:left-[23px]" />

          <div className="space-y-12">
            {ROADMAP_PHASES.map((phase) => (
              <motion.div
                key={phase.id}
                variants={fadeInUp}
                className="relative pl-12 md:pl-16"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-0 md:left-1">
                  <div
                    className="relative h-10 w-10 border-2 md:h-12 md:w-12"
                    style={{
                      borderColor: STATUS_COLORS[phase.status],
                      backgroundColor: `${STATUS_COLORS[phase.status]}10`,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-neural-white/60">
                      {phase.name.split(" ")[1]}
                    </span>
                    {phase.status === "active" && (
                      <span
                        className="absolute inset-0 animate-glow-pulse"
                        style={{ boxShadow: `0 0 20px ${STATUS_COLORS[phase.status]}40` }}
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-headline text-lg font-bold uppercase tracking-[0.1em] text-neural-white md:text-xl">
                      {phase.codename}
                    </h3>
                    <Badge color={STATUS_COLORS[phase.status]}>
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-neural-white/30">
                    {phase.timeline}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-neural-white/40">
                        <span className="mt-0.5 shrink-0 font-mono text-[10px] text-pulse-cyan/30">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
