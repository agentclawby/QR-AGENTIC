"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
import { DataTicker } from "./DataTicker";
import { NAV_ITEMS } from "@/lib/constants";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeSection = useScrollSpy();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <DataTicker />
      <nav className="border-b border-ghost-gray/50 bg-void-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#hero" className="relative z-50">
            <Logo />
          </a>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-200",
                  activeSection === item.href.slice(1)
                    ? "text-pulse-cyan"
                    : "text-neural-white/50 hover:text-neural-white"
                )}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/app"
              className="border border-pulse-cyan bg-pulse-cyan/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pulse-cyan transition-all hover:bg-pulse-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              Launch App
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative z-50 flex flex-col gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-px w-6 bg-neural-white"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block h-px w-6 bg-neural-white"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-px w-6 bg-neural-white"
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-void-black/95 backdrop-blur-lg md:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-headline text-2xl font-bold uppercase tracking-[0.3em] text-neural-white transition-colors hover:text-pulse-cyan"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 border border-pulse-cyan bg-pulse-cyan/10 px-8 py-3 font-mono text-sm uppercase tracking-[0.2em] text-pulse-cyan"
            >
              Launch App
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
