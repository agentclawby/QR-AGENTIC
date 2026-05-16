"use client";

import { motion } from "framer-motion";
import { TOKEN_UTILITIES, DEFLATIONARY_MECHANICS } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeInUp, staggerContainer, staggerFast, depthIn } from "@/lib/animations";

export function Token() {
  return (
    <section
      id="token"
      className="relative py-[var(--spacing-section-mobile)] md:py-[var(--spacing-section)]"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading
          title="Passport & Credits"
          subtitle="Solana-native identity first. Token mechanics second."
        />

        {/* Token Utility Table */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16 md:mb-24"
        >
          <motion.p variants={fadeInUp} className="mb-8 text-center font-body text-sm text-neural-white/60 md:text-base">
            The core product is useful without a tradable token. Wallet
            identity, Agent Passports, and included credits stand on their
            own — token mechanics layer on top when they fit.
          </motion.p>

          <motion.div variants={staggerFast} className="grid gap-3 md:grid-cols-2">
            {TOKEN_UTILITIES.map((util) => (
              <motion.div
                key={util.function}
                variants={depthIn}
                whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.5)" }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="group relative flex flex-col gap-2 overflow-hidden border border-ghost-gray/30 bg-ghost-gray/10 p-4 sm:flex-row sm:gap-4"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 30%, rgba(0,240,255,0.06) 50%, transparent 70%)",
                  }}
                />
                <span className="relative shrink-0 font-mono text-xs font-medium uppercase tracking-[0.1em] text-pulse-cyan sm:tracking-[0.15em]">
                  {util.function}
                </span>
                <span className="relative min-w-0 text-sm leading-relaxed text-neural-white/55 group-hover:text-neural-white/80">
                  {util.usage}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Launch Discipline — safety mechanics, no supply chart */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={fadeInUp}>
            <h3 className="mb-8 text-center font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
              Launch Discipline
            </h3>
            <motion.div variants={staggerFast} className="grid gap-4 md:grid-cols-2">
              {DEFLATIONARY_MECHANICS.map((mech, i) => (
                <motion.div
                  key={mech.name}
                  variants={depthIn}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative overflow-hidden border-l-2 border-ember-orange/40 bg-ember-orange-10 p-4 transition-colors hover:border-ember-orange"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,107,53,0.15) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative flex min-w-0 items-center gap-3">
                    <span className="font-mono text-[10px] text-ember-orange/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="min-w-0 break-words font-headline text-sm font-bold uppercase tracking-[0.08em] text-ember-orange sm:tracking-[0.1em]">
                      {mech.name}
                    </h4>
                  </div>
                  <p className="relative mt-2 text-sm leading-relaxed text-neural-white/55 group-hover:text-neural-white/80 sm:pl-8">
                    {mech.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
