"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WalletConnectButton } from "./WalletConnectButton";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/icons/Logo";

export function LoginPanel() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleXLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "twitter",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch {
      setError("Connection failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/50 bg-void-black p-8 sm:p-10">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      {/* Heading */}
      <h1 className="mb-2 text-center font-headline text-2xl font-bold uppercase tracking-[0.15em] text-neural-white">
        Initialize.
      </h1>
      <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.15em] text-neural-white/40">
        Connect to enter the network
      </p>

      {/* Auth Options */}
      <div className="space-y-4">
        {/* X / Twitter */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleXLogin}
          disabled={loading}
        >
          <svg
            className="mr-3 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {loading ? "Connecting..." : "Connect with X"}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-ghost-gray/50" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
            or
          </span>
          <div className="h-px flex-1 bg-ghost-gray/50" />
        </div>

        {/* Solana Wallet */}
        <WalletConnectButton />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 border border-ember-orange/50 bg-ember-orange/10 p-3">
          <p className="font-mono text-xs text-ember-orange">{error}</p>
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/20">
        Your identity begins here.
      </p>
    </div>
  );
}
