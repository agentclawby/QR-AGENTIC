"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { AppMobileNav, AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileSidebar } from "./MobileSidebar";
import { AuroraBackdrop } from "@/components/effects/AuroraBackdrop";
import { pageTransition } from "@/lib/animations";
import type { Profile } from "@/types";

interface AppShellProps {
  children: ReactNode;
  profile: Profile | null;
  isAdmin?: boolean;
}

export function AppShell({ children, profile, isAdmin = false }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-void-black">
      {/* Subtle ambient backdrop */}
      <AuroraBackdrop fixed variant="soft" className="opacity-50" />

      <AppSidebar isAdmin={isAdmin} />

      {/* Main content area */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <AppHeader profile={profile} onMenuClick={() => setMobileNavOpen(true)} />
        <motion.main
          key={pathname}
          variants={pageTransition}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-6 md:pb-8 lg:px-10 xl:px-12"
        >
          {children}
        </motion.main>
      </div>

      <AppMobileNav isAdmin={isAdmin} />

      {/* Mobile drawer — sibling to AppSidebar so route transitions never
          unmount it mid-animation. md:hidden gating lives inside. */}
      <MobileSidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isAdmin={isAdmin}
      />
    </div>
  );
}
