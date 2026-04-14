"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", href: "/app", icon: "◆" },
  { label: "Forge", href: "/app/forge", icon: "⬡" },
  { label: "Cortex", href: "/app/cortex", icon: "◈" },
  { label: "Leaderboard", href: "/app/leaderboard", icon: "▲" },
  { label: "Settings", href: "/app/settings", icon: "⚙" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-ghost-gray/30 bg-void-black md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-ghost-gray/30 px-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-all duration-200",
                    isActive
                      ? "border-l-2 border-pulse-cyan bg-pulse-cyan/5 text-pulse-cyan"
                      : "border-l-2 border-transparent text-neural-white/40 hover:border-ghost-gray hover:bg-ghost-gray/10 hover:text-neural-white/70"
                  )}
                >
                  <span className="text-sm">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Network status */}
      <div className="border-t border-ghost-gray/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-pulse-cyan shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
            Network Online
          </span>
        </div>
      </div>
    </aside>
  );
}
