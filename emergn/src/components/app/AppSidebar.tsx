"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/icons/Logo";
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
  { label: "Leaderboard", href: "/app/leaderboard", icon: "▲" },
  { label: "Settings", href: "/app/settings", icon: "⚙" },
];

const ADMIN_LINK: NavLink = { label: "Admin", href: "/app/admin", icon: "▣" };

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();
  const navLinks = isAdmin ? [...BASE_NAV_LINKS, ADMIN_LINK] : BASE_NAV_LINKS;

  return (
    <aside
      className="sticky top-0 hidden h-screen w-60 shrink-0 self-start flex-col overflow-hidden border-r border-ghost-gray/30 bg-void-black md:flex"
      style={{ height: "100dvh" }}
    >
      {/* atmospheric right-edge gradient */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-pulse-cyan/30 to-transparent"
      />

      {/* Logo */}
      <div className="relative z-10 flex h-16 shrink-0 items-center border-b border-ghost-gray/30 bg-void-black px-6">
        <Link href="/" className="group" aria-label="EMERGN. home">
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <Logo />
          </motion.div>
        </Link>
      </div>

      {/* Navigation — min-h-0 lets flex-1 actually constrain the nav inside the
          column so it can scroll on tiny laptop heights rather than blowing
          out the layout. */}
      <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {/* top fade-edge (subtle scroll affordance when nav scrolls) */}
        <span
          aria-hidden
          className="pointer-events-none sticky top-0 -mt-4 block h-4 w-full bg-gradient-to-b from-void-black to-transparent"
        />
        <ul className="relative space-y-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href} className="relative">
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 bg-pulse-cyan/8 shadow-[inset_0_1px_0_rgba(0,240,255,0.2)]"
                    transition={{ type: "spring", stiffness: 400, damping: 38 }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-0 h-full w-[2px] bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 38 }}
                  />
                )}
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors duration-200",
                    isActive
                      ? "text-pulse-cyan glow-text-cyan"
                      : "text-neural-white/55 hover:text-neural-white"
                  )}
                >
                  <motion.span
                    whileHover={{ rotate: 12, scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className={cn(
                      "text-sm transition-colors",
                      isActive ? "text-pulse-cyan" : "text-neural-white/40 group-hover:text-pulse-cyan"
                    )}
                  >
                    {link.icon}
                  </motion.span>
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {/* bottom fade-edge */}
        <span
          aria-hidden
          className="pointer-events-none sticky bottom-0 -mb-4 block h-4 w-full bg-gradient-to-t from-void-black to-transparent"
        />
      </nav>

      {/* Network status — always pinned to bottom of the aside */}
      <div className="relative z-10 shrink-0 border-t border-ghost-gray/30 bg-void-black px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="status-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
            Network Online
          </span>
        </div>
      </div>
    </aside>
  );
}

export function AppMobileNav({ isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();
  const navLinks = isAdmin ? [...BASE_NAV_LINKS, ADMIN_LINK] : BASE_NAV_LINKS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ghost-gray/30 bg-void-black/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl md:hidden">
      <ul className="flex items-stretch gap-1 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="min-w-[74px] flex-1">
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center gap-1 px-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
                  isActive
                    ? "bg-pulse-cyan/10 text-pulse-cyan"
                    : "text-neural-white/45 hover:text-neural-white",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 top-0 h-px bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="text-sm leading-none">{link.icon}</span>
                <span className="max-w-full truncate">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
