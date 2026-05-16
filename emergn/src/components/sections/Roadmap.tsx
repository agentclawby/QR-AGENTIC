"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ROADMAP_PHASES } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { fadeInUp, staggerContainer, depthIn } from "@/lib/animations";

const STATUS_COLORS = {
  completed: "#00F0FF",
  active: "#8B5CF6",
  upcoming: "#2A2A35",
};

export function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 30%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="roadmap"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading title="Roadmap." subtitle="From signal to sovereignty." />

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          {/* Static dim track */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-ghost-gray/30 md:left-[23px]" />
          {/* Animated bright track that reveals on scroll */}
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-[19px] top-0 w-px origin-top bg-gradient-to-b from-pulse-cyan via-signal-violet to-ember-orange shadow-[0_0_12px_rgba(0,240,255,0.6)] md:left-[23px]"
          />

          <div className="space-y-12">
            {ROADMAP_PHASES.map((phase) => {
              const color = STATUS_COLORS[phase.status];
              return (
                <motion.div
                  key={phase.id}
                  variants={depthIn}
                  className="relative pl-12 md:pl-16"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 md:left-1">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 18 }}
                      className="relative h-10 w-10 border-2 md:h-12 md:w-12"
                      style={{
                        borderColor: color,
                        backgroundColor: `${color}10`,
                      }}
                    >
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-neural-white/60">
                        {phase.name.split(" ")[1]}
                      </span>
                      {phase.status === "active" && (
                        <>
                          <span
                            className="absolute inset-0 animate-glow-pulse"
                            style={{ boxShadow: `0 0 24px ${color}66` }}
                          />
                          <motion.span
                            className="absolute inset-0 border-2"
                            style={{ borderColor: color }}
                            animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                          />
                        </>
                      )}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="break-words font-headline text-lg font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em] md:text-xl">
                        {phase.codename}
                      </h3>
                      <Badge color={color} pulse={phase.status === "active"} dot={phase.status === "active"}>
                        {phase.status}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-neural-white/40">
                      {phase.timeline}
                    </p>
                    <motion.ul
                      variants={staggerContainer}
                      className="mt-4 space-y-2"
                    >
                      {phase.items.map((item, i) => (
                        <motion.li
                          key={i}
                          variants={fadeInUp}
                          className="flex gap-3 text-sm leading-relaxed text-neural-white/55 transition-colors hover:text-neural-white/85"
                        >
                          <span className="mt-0.5 shrink-0 font-mono text-[10px] text-pulse-cyan/40">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {item}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
