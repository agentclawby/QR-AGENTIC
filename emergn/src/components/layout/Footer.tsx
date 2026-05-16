"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
import { staggerFast, fadeInUpSoft } from "@/lib/animations";

const FOOTER_LINKS = [
  { label: "Twitter / X", href: "#" },
  { label: "Discord", href: "#" },
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "#" },
];

const FOOTER_STATS = [
  { label: "Network Status", value: "OPERATIONAL", color: "text-pulse-cyan", live: true },
  { label: "Agents Online", value: "14,209", color: "text-neural-white" },
  { label: "$EMRG Price", value: "$0.47", color: "text-neural-white" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ghost-gray/50 bg-void-black">
      {/* atmospheric top gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse-cyan/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-32 [background:radial-gradient(50%_60%_at_50%_100%,rgba(0,240,255,0.08),transparent_70%)]"
      />

      <motion.div
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <motion.div variants={fadeInUpSoft}>
            <Logo className="text-3xl" />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/50 sm:tracking-[0.2em]">
              Identity. Autonomy. Evolution.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div variants={staggerFast} className="flex flex-col gap-3">
            {FOOTER_LINKS.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                variants={fadeInUpSoft}
                whileHover={{ x: 6 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="group relative inline-block w-fit font-mono text-xs uppercase tracking-[0.1em] text-neural-white/50 transition-colors hover:text-pulse-cyan sm:tracking-[0.15em]"
              >
                <span className="relative z-10">→ {link.label}</span>
              </motion.a>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div variants={staggerFast} className="flex flex-col gap-3">
            {FOOTER_STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUpSoft}
                className="flex min-w-0 flex-wrap items-center justify-between gap-2 md:justify-end md:gap-4"
              >
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
                  {stat.label}
                </span>
                <span className={`flex items-center gap-2 font-mono text-xs font-medium tracking-normal sm:tracking-wider ${stat.color}`}>
                  {stat.live && <span className="status-dot" aria-hidden />}
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={fadeInUpSoft}
          className="mt-12 flex flex-col items-center gap-4 border-t border-ghost-gray/30 pt-8 text-center md:mt-16 md:flex-row md:justify-between md:text-left"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30 sm:tracking-[0.2em]">
            &copy; 2026 EMERGN. Protocol
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30 caret sm:tracking-[0.2em]">
            They&apos;re already here.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
