"use client";

import { type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import type { Profile } from "@/types";

interface AppShellProps {
  children: ReactNode;
  profile: Profile | null;
}

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-void-black">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <AppHeader profile={profile} />
        <main className="flex-1 px-6 py-6 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
