"use client";

import { motion } from "framer-motion";
import { useLinkWallet } from "@/hooks/useLinkWallet";
import { cn } from "@/lib/utils";

interface LinkWalletChipProps {
  userId: string;
  className?: string;
}

// Compact header chip surfaced when a signed-in user has no Solana wallet
// linked yet. Clicking opens the wallet-adapter modal; once they pick a
// wallet, the useLinkWallet hook auto-runs the SIWS link flow.
//
// Designed for the AppHeader. Only renders when userId is non-null AND the
// caller has determined no wallet is linked (caller controls visibility).
export function LinkWalletChip({ userId, className }: LinkWalletChipProps) {
  const { triggerWalletConnect, loading, error } = useLinkWallet({ userId });

  return (
    <motion.button
      type="button"
      onClick={triggerWalletConnect}
      disabled={loading}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      title={
        error ??
        "Link a Solana wallet to unlock Agent Passport issuance and on-chain identity."
      }
      className={cn(
        "group relative inline-flex shrink-0 items-center gap-2 border border-signal-violet/40 bg-signal-violet/[0.06] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-violet transition-colors hover:border-signal-violet hover:bg-signal-violet/[0.12] sm:tracking-[0.18em]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 bg-signal-violet shadow-[0_0_8px_rgba(139,92,246,0.7)]"
      />
      <span>{loading ? "Linking…" : "Link Wallet"}</span>
      <span
        aria-hidden
        className="text-signal-violet/70 transition-transform group-hover:translate-x-0.5"
      >
        →
      </span>
    </motion.button>
  );
}
