"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { buildSolanaAuthMessage } from "@/lib/auth/solana-auth";

// Shared SIWS wallet-link flow. Used by:
//   - Settings → Linked Accounts (the original home)
//   - AgentPassportPanel (in-context Link Wallet button on the Passport tab)
//   - LinkWalletChip (global header chip when a user has no wallet linked)
//
// The flow:
//   1. If wallet not connected → open the wallet-adapter modal. Once the
//      user picks/connects a wallet, an effect inside the hook auto-triggers
//      the link call (so the user doesn't have to click twice).
//   2. If wallet connected → fetch nonce, sign the SIWS message, POST to
//      /api/auth/link-wallet, refresh the route so server-side `profile`
//      data reflects the new wallet_address.

interface UseLinkWalletOptions {
  // The profile.id of the currently signed-in user. Required — wallet linking
  // attaches the wallet to this Supabase user. Pass null/undefined for anon
  // sessions; calling triggerWalletConnect() will be a no-op in that case.
  userId?: string | null;
  // Called when wallet linking finishes successfully — the consumer can do
  // local UI updates (close a panel, refresh local state). The hook ALSO
  // calls router.refresh() internally so server-side `profile.wallet_address`
  // reflects the new state in the same paint.
  onLinked?: (publicKey: string) => void;
}

export interface UseLinkWalletState {
  loading: boolean;
  error: string | null;
  connected: boolean;
  walletAddress: string | null;
  // Opens the wallet-adapter modal if no wallet connected; otherwise runs
  // the link flow immediately.
  triggerWalletConnect: () => void;
  // Bypasses the modal — runs the SIWS link directly when you know the
  // wallet is already connected. (Mostly used internally by the auto-link
  // effect, but exposed for completeness.)
  linkWallet: () => Promise<void>;
}

export function useLinkWallet({
  userId,
  onLinked,
}: UseLinkWalletOptions): UseLinkWalletState {
  const router = useRouter();
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks an in-flight "user clicked connect, waiting for modal" state so
  // when the wallet adapter flips on we know to chain straight into linking.
  const pendingLinkRef = useRef(false);

  const linkWallet = useCallback(async () => {
    if (!userId) {
      setError("Sign in before linking a wallet.");
      return;
    }
    if (!publicKey || !signMessage) {
      setError("Connect a wallet first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nonceResponse = await fetch("/api/auth/siws/nonce", {
        cache: "no-store",
      });
      if (!nonceResponse.ok) {
        throw new Error("Failed to request a wallet nonce");
      }
      const { nonce } = await nonceResponse.json();

      const message = new TextEncoder().encode(
        buildSolanaAuthMessage({
          intent: "link-wallet",
          publicKey: publicKey.toBase58(),
          nonce,
          origin: window.location.origin,
          userId,
        })
      );
      const signature = await signMessage(message);

      const response = await fetch("/api/auth/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: bs58.encode(message),
          nonce,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to link wallet");
      }

      router.refresh();
      onLinked?.(publicKey.toBase58());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link wallet");
    } finally {
      setLoading(false);
    }
  }, [userId, publicKey, signMessage, router, onLinked]);

  const triggerWalletConnect = useCallback(() => {
    if (!userId) {
      // Anonymous caller — nothing we can do here. The caller should route
      // the user through /login before reaching this hook.
      setError("Sign in before linking a wallet.");
      return;
    }
    if (connected && publicKey && signMessage) {
      void linkWallet();
    } else {
      pendingLinkRef.current = true;
      setVisible(true);
    }
  }, [userId, connected, publicKey, signMessage, linkWallet, setVisible]);

  // When the wallet adapter flips from disconnected → connected after the
  // user picked a wallet in the modal, auto-fire the link call so the user
  // doesn't have to click a second time.
  useEffect(() => {
    if (
      pendingLinkRef.current &&
      connected &&
      publicKey &&
      signMessage &&
      userId
    ) {
      pendingLinkRef.current = false;
      void linkWallet();
    }
  }, [connected, publicKey, signMessage, userId, linkWallet]);

  return {
    loading,
    error,
    connected: Boolean(connected && publicKey),
    walletAddress: publicKey?.toBase58() ?? null,
    triggerWalletConnect,
    linkWallet,
  };
}
