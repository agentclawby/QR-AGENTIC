"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { CreditBalance } from "@/components/payments/CreditBalance";
import type { Profile } from "@/types";

interface AppHeaderProps {
  profile: Profile | null;
}

export function AppHeader({ profile }: AppHeaderProps) {
  const { signOut } = useAuth();

  const displayName =
    profile?.x_handle
      ? `@${profile.x_handle}`
      : profile?.wallet_address
        ? `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}`
        : profile?.username || "Agent";

  return (
    <header className="flex h-16 items-center justify-between border-b border-ghost-gray/30 px-6 sm:px-8">
      {/* Mobile logo (visible on small screens where sidebar is hidden) */}
      <div className="md:hidden">
        <span className="font-headline text-sm font-bold tracking-[0.2em] text-neural-white">
          EMERGN.
        </span>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden md:block" />

      {/* User info */}
      <div className="flex items-center gap-4">
        <CreditBalance />
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/50">
          {displayName}
        </span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
