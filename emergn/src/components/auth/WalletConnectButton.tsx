"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/Button";
import { buildSolanaAuthMessage } from "@/lib/auth/solana-auth";
import bs58 from "bs58";

export function WalletConnectButton() {
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSIWS = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/auth/siws/nonce", {
        cache: "no-store",
      });
      if (!nonceRes.ok) {
        throw new Error("Failed to request a wallet nonce");
      }
      const { nonce } = await nonceRes.json();

      // 2. Construct SIWS message
      const message = new TextEncoder().encode(
        buildSolanaAuthMessage({
          intent: "sign-in",
          publicKey: publicKey.toBase58(),
          nonce,
          origin: window.location.origin,
        })
      );

      // 3. Sign the message
      const signature = await signMessage(message);

      // 4. Verify on server and get session
      const verifyRes = await fetch("/api/auth/siws/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: bs58.encode(message),
          nonce,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        // The verify route returns 500 with "Failed to create wallet user"
        // when Supabase Admin API is unreachable. Surface a clearer
        // diagnosis so the user knows where to look.
        const reason = verifyData.error || "Verification failed";
        const isAdminFailure =
          /Failed to create wallet user/i.test(reason) ||
          /Failed to generate session/i.test(reason);
        throw new Error(
          isAdminFailure
            ? "Auth server unreachable. The Supabase project may be paused or the URL/keys are wrong — check the server logs and your .env.local."
            : reason
        );
      }

      // Use the verification URL to establish the Supabase session
      if (verifyData.verification_url) {
        window.location.href = verifyData.verification_url;
      } else {
        window.location.href = "/app";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet sign-in failed";
      // Native fetch failures (DNS / network) — surface the Supabase hint.
      const isNetwork =
        /fetch failed/i.test(message) ||
        /failed to fetch/i.test(message) ||
        /networkerror/i.test(message);
      setError(
        isNetwork
          ? "Auth server unreachable. The Supabase project may be paused — check NEXT_PUBLIC_SUPABASE_URL."
          : message
      );
      setLoading(false);
    }
  }, [publicKey, signMessage]);

  // Auto-trigger SIWS after wallet connects
  useEffect(() => {
    if (connected && publicKey && signMessage) {
      handleSIWS();
    }
  }, [connected, publicKey, signMessage, handleSIWS]);

  const handleClick = () => {
    if (connected) {
      handleSIWS();
    } else {
      setVisible(true);
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleClick}
        disabled={loading}
        loading={loading}
      >
        <svg
          className="mr-3 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="6" width="20" height="12" rx="0" />
          <path d="M22 10H18C16.9 10 16 10.9 16 12C16 13.1 16.9 14 18 14H22" />
        </svg>
        {loading ? "Verifying signal..." : "Initialize wallet"}
      </Button>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-ember-orange">{error}</p>
      )}
    </div>
  );
}
