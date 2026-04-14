"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/Button";
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
      const nonceRes = await fetch("/api/auth/siws/nonce");
      const { nonce } = await nonceRes.json();

      // 2. Construct SIWS message
      const message = new TextEncoder().encode(
        `Sign in to EMERGN.\n\n` +
        `Wallet: ${publicKey.toBase58()}\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${new Date().toISOString()}`
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
        throw new Error(verifyData.error || "Verification failed");
      }

      // Use the verification URL to establish the Supabase session
      if (verifyData.verification_url) {
        window.location.href = verifyData.verification_url;
      } else {
        window.location.href = "/app";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet sign-in failed");
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
        {loading ? "Verifying..." : "Connect Wallet"}
      </Button>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-ember-orange">{error}</p>
      )}
    </div>
  );
}
