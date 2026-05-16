"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { CreditBalance } from "@/components/payments/CreditBalance";
import { LinkWalletChip } from "@/components/auth/LinkWalletChip";
import type { Profile } from "@/types";

interface AppHeaderProps {
  profile: Profile | null;
  onMenuClick?: () => void;
}

export function AppHeader({ profile, onMenuClick }: AppHeaderProps) {
  const { isSigningOut, signOut } = useAuth();

  const displayName =
    profile?.x_handle
      ? `@${profile.x_handle}`
      : profile?.wallet_address
        ? `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}`
        : profile?.username || "Agent";

  const isAnonymous = !profile;

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-ghost-gray/30 bg-void-black/85 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8"
    >
      {/* hairline accent */}
      <span aria-hidden className="hairline absolute inset-x-0 bottom-0" />

      {/* Mobile hamburger + logo cluster */}
      <div className="flex shrink-0 items-center gap-3 md:hidden">
        <motion.button
          type="button"
          onClick={onMenuClick}
          whileTap={{ scale: 0.92 }}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center border border-ghost-gray/40 text-neural-white/70 transition-colors hover:border-pulse-cyan/60 hover:text-pulse-cyan focus-visible:border-pulse-cyan"
        >
          <span aria-hidden className="flex flex-col gap-[3px]">
            <span className="block h-[1.5px] w-4 bg-current" />
            <span className="block h-[1.5px] w-4 bg-current" />
            <span className="block h-[1.5px] w-4 bg-current" />
          </span>
        </motion.button>
        <span className="font-headline text-sm font-bold tracking-[0.2em] text-neural-white">
          EMERGN.
        </span>
      </div>

      <div className="hidden md:flex md:items-center md:gap-3">
        <span className="status-dot" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neural-white/40">
          Live · Realtime sync
        </span>
      </div>

      {/* Right cluster: credit balance, wallet chip, identity, auth action */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 md:flex-none">
        {!isAnonymous ? <CreditBalance /> : null}

        {/* Wallet-link chip — visible only when signed in but no wallet
            attached. Lets users link a wallet from any /app page without
            navigating to Settings. */}
        {profile && !profile.wallet_address ? (
          <LinkWalletChip userId={profile.id} />
        ) : null}

        {isAnonymous ? (
          <Button
            variant="primary"
            size="sm"
            href="/login"
            magnetic={false}
            className="shrink-0"
          >
            Sign In
          </Button>
        ) : (
          <>
            <motion.span
              whileHover={{ color: "#00F0FF" }}
              className="hidden max-w-[180px] truncate font-mono text-xs uppercase tracking-[0.1em] text-neural-white/60 sm:inline"
            >
              {displayName}
            </motion.span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              disabled={isSigningOut}
              className="shrink-0"
            >
              Sign Out
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
}
