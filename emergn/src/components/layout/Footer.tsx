"use client";

import { Logo } from "@/components/icons/Logo";

const FOOTER_LINKS = [
  { label: "Twitter / X", href: "#" },
  { label: "Discord", href: "#" },
  { label: "Docs", href: "#" },
  { label: "GitHub", href: "#" },
];

const FOOTER_STATS = [
  { label: "Network Status", value: "OPERATIONAL", color: "text-pulse-cyan" },
  { label: "Agents Online", value: "14,209", color: "text-neural-white" },
  { label: "$EMRG Price", value: "$0.47", color: "text-neural-white" },
];

export function Footer() {
  return (
    <footer className="border-t border-ghost-gray/50 bg-void-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Logo className="text-3xl" />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-neural-white/40">
              Identity. Autonomy. Evolution.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-xs uppercase tracking-[0.15em] text-neural-white/40 transition-colors hover:text-pulse-cyan"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3">
            {FOOTER_STATS.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between md:justify-end md:gap-4">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/30">
                  {stat.label}
                </span>
                <span className={`font-mono text-xs font-medium tracking-wider ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-ghost-gray/30 pt-8 md:flex-row md:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/20">
            &copy; 2026 EMERGN. Protocol
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/20">
            They&apos;re already here.
          </p>
        </div>
      </div>
    </footer>
  );
}
