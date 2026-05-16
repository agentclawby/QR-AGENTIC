"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLinkWallet } from "@/hooks/useLinkWallet";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types";

interface LinkedAccountsProps {
  profile: Profile;
}

export function LinkedAccounts({ profile }: LinkedAccountsProps) {
  const { isSigningOut, signOut } = useAuth();
  const [xLoading, setXLoading] = useState(false);
  const [xError, setXError] = useState<string | null>(null);

  const {
    triggerWalletConnect,
    loading: walletLoading,
    error: walletError,
  } = useLinkWallet({ userId: profile.id });

  const handleLinkX = async () => {
    setXLoading(true);
    setXError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: "x",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/app/settings`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isProviderDisabled =
        /provider is not enabled/i.test(message) ||
        /unsupported provider/i.test(message) ||
        /provider not found/i.test(message);
      if (isProviderDisabled) {
        setXError("X sign-in is temporarily unavailable. Please try again later.");
      } else {
        setXError(message || "Failed to link X");
      }
      setXLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
      <h2 className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
        Linked Accounts
      </h2>

      <div className="space-y-4">
        {/* X / Twitter */}
        <div className="flex flex-col items-stretch justify-between gap-4 border border-ghost-gray/10 bg-void-black p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <svg
              className="h-4 w-4 text-neural-white/40"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-neural-white/60 sm:tracking-[0.1em]">
                X / Twitter
              </p>
              {profile.x_handle ? (
                <p className="truncate font-mono text-sm text-pulse-cyan">
                  @{profile.x_handle}
                </p>
              ) : (
                <p className="font-mono text-xs text-neural-white/20">
                  Not connected
                </p>
              )}
              {xError ? (
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-ember-orange">
                  {xError}
                </p>
              ) : null}
            </div>
          </div>
          {profile.x_handle ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.1em]">
              Connected
            </span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLinkX}
              disabled={xLoading}
              className="w-full sm:w-auto"
            >
              {xLoading ? "Linking..." : "Link X"}
            </Button>
          )}
        </div>

        {/* Wallet */}
        <div className="flex flex-col items-stretch justify-between gap-4 border border-ghost-gray/10 bg-void-black p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
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
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-neural-white/60 sm:tracking-[0.1em]">
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
              {walletError ? (
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-ember-orange">
                  {walletError}
                </p>
              ) : null}
            </div>
          </div>
          {profile.wallet_address ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-signal-violet sm:tracking-[0.1em]">
              Connected
            </span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={triggerWalletConnect}
              disabled={walletLoading}
              className="w-full sm:w-auto"
            >
              {walletLoading ? "Signing..." : "Link Wallet"}
            </Button>
          )}
        </div>
      </div>

      {/* Sign Out */}
      <div className="mt-8 border-t border-ghost-gray/10 pt-6">
        <Button
          variant="ghost"
          size="md"
          onClick={() => void signOut()}
          disabled={isSigningOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
