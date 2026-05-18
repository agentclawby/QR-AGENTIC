"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
  icon: string;
}

const BASE_NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/app", icon: "◆" },
  { label: "Create Agent", href: "/app/forge", icon: "⬡" },
  { label: "Cortex", href: "/app/cortex", icon: "◈" },
  { label: "Tokens", href: "/app/tokens", icon: "◉" },
  { label: "Leaderboard", href: "/app/leaderboard", icon: "▲" },
  { label: "Settings", href: "/app/settings", icon: "⚙" },
];

const ADMIN_LINK: NavLink = { label: "Admin", href: "/app/admin", icon: "▣" };

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileSidebar({ isOpen, onClose, isAdmin = false }: MobileSidebarProps) {
  const pathname = usePathname();
  const navLinks = isAdmin ? [...BASE_NAV_LINKS, ADMIN_LINK] : BASE_NAV_LINKS;
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useLockBodyScroll(isOpen);

  // Auto-close on route change so tapping a nav link dismisses the drawer.
  useEffect(() => {
    if (isOpen) onClose();
    // We only want to react to the pathname changing while open. Including
    // onClose/isOpen here would create a feedback loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC to close + focus management
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <div className="md:hidden">
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={onClose}
              aria-hidden
              className="fixed inset-0 z-40 bg-void-black/70 backdrop-blur-sm"
            />

            <motion.aside
              key="mobile-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.7 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-[320px] flex-col border-r border-ghost-gray/40 bg-void-black"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-pulse-cyan/30 to-transparent"
              />

              {/* Header: logo + close */}
              <div className="flex h-16 items-center justify-between border-b border-ghost-gray/30 px-5">
                <Link href="/" onClick={onClose} aria-label="EMERGN. home">
                  <Logo />
                </Link>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center border border-ghost-gray/40 font-mono text-sm text-neural-white/70 transition-colors hover:border-pulse-cyan/60 hover:text-pulse-cyan focus-visible:border-pulse-cyan"
                >
                  ✕
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="relative space-y-1">
                  {navLinks.map((link) => {
                    const isActive =
                      link.href === "/app"
                        ? pathname === "/app"
                        : pathname.startsWith(link.href);

                    return (
                      <li key={link.href} className="relative">
                        {isActive ? (
                          <>
                            <motion.span
                              layoutId="mobile-drawer-active-bg"
                              className="absolute inset-0 bg-pulse-cyan/8 shadow-[inset_0_1px_0_rgba(0,240,255,0.2)]"
                              transition={{ type: "spring", stiffness: 400, damping: 38 }}
                            />
                            <motion.span
                              layoutId="mobile-drawer-active-bar"
                              className="absolute left-0 top-0 h-full w-[2px] bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                              transition={{ type: "spring", stiffness: 400, damping: 38 }}
                            />
                          </>
                        ) : null}
                        <Link
                          href={link.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200",
                            isActive
                              ? "text-pulse-cyan glow-text-cyan"
                              : "text-neural-white/55 hover:text-neural-white",
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm",
                              isActive
                                ? "text-pulse-cyan"
                                : "text-neural-white/45 group-hover:text-pulse-cyan",
                            )}
                          >
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Network status footer */}
              <div className="border-t border-ghost-gray/30 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="status-dot" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
                    Network Online
                  </span>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
