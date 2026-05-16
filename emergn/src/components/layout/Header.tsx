"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
import { DataTicker } from "./DataTicker";
import { NAV_ITEMS } from "@/lib/constants";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useScrollSpy();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 12);
  });

  // lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <DataTicker />
      <motion.nav
        animate={{
          backgroundColor: scrolled ? "rgba(10,10,15,0.92)" : "rgba(10,10,15,0.65)",
          backdropFilter: scrolled ? "blur(24px)" : "blur(12px)",
          borderColor: scrolled ? "rgba(0,240,255,0.18)" : "rgba(0,240,255,0.06)",
        }}
        transition={{ duration: 0.3 }}
        className="relative border-b"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#hero" className="relative z-50 group">
            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 280, damping: 16 }}>
              <Logo />
            </motion.div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href.slice(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-200",
                    isActive
                      ? "text-pulse-cyan"
                      : "text-neural-white/60 hover:text-neural-white"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pulse-cyan to-transparent"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                </a>
              );
            })}
            <motion.a
              href="/app"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="border border-pulse-cyan bg-pulse-cyan/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pulse-cyan transition-all hover:bg-pulse-cyan/20 hover:shadow-[0_0_28px_rgba(0,240,255,0.45),inset_0_0_18px_rgba(0,240,255,0.18)]"
            >
              Launch App
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
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
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-void-black/95 px-6 py-24 backdrop-blur-2xl lg:hidden"
          >
            {NAV_ITEMS.map((item, i) => (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i + 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-center font-headline text-xl font-bold uppercase tracking-[0.18em] text-neural-white transition-colors hover:text-pulse-cyan sm:text-2xl sm:tracking-[0.3em]"
              >
                {item.label}
              </motion.a>
            ))}
            <motion.a
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.45 }}
              className="mt-4 border border-pulse-cyan bg-pulse-cyan/10 px-8 py-3 font-mono text-sm uppercase tracking-[0.2em] text-pulse-cyan glow-cyan"
            >
              Launch App
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
