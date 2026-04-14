"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

interface LinkedAccountsProps {
  profile: Profile;
}

export function LinkedAccounts({ profile }: LinkedAccountsProps) {
  const { signOut } = useAuth();

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
        Linked Accounts
      </h2>

      <div className="space-y-4">
        {/* X / Twitter */}
        <div className="flex items-center justify-between border border-ghost-gray/10 bg-void-black p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-4 w-4 text-neural-white/40"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/60">
                X / Twitter
              </p>
              {profile.x_handle ? (
                <p className="font-mono text-sm text-pulse-cyan">
                  @{profile.x_handle}
                </p>
              ) : (
                <p className="font-mono text-xs text-neural-white/20">
                  Not connected
                </p>
              )}
            </div>
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
              profile.x_handle ? "text-pulse-cyan" : "text-neural-white/20"
            }`}
          >
            {profile.x_handle ? "Connected" : "—"}
          </span>
        </div>

        {/* Wallet */}
        <div className="flex items-center justify-between border border-ghost-gray/10 bg-void-black p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-4 w-4 text-neural-white/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="6" width="20" height="12" rx="0" />
              <path d="M22 10H18C16.9 10 16 10.9 16 12C16 13.1 16.9 14 18 14H22" />
            </svg>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-neural-white/60">
                Solana Wallet
              </p>
              {profile.wallet_address ? (
                <p className="font-mono text-sm text-signal-violet">
                  {profile.wallet_address.slice(0, 6)}...
                  {profile.wallet_address.slice(-4)}
                </p>
              ) : (
                <p className="font-mono text-xs text-neural-white/20">
                  Not connected
                </p>
              )}
            </div>
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
              profile.wallet_address
                ? "text-signal-violet"
                : "text-neural-white/20"
            }`}
          >
            {profile.wallet_address ? "Connected" : "—"}
          </span>
        </div>
      </div>

      {/* Sign Out */}
      <div className="mt-8 border-t border-ghost-gray/10 pt-6">
        <Button variant="ghost" size="md" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
