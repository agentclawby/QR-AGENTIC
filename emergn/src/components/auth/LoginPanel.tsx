"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WalletConnectButton } from "./WalletConnectButton";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/icons/Logo";
import { depthIn, staggerFast, fadeInUpSoft, shake } from "@/lib/animations";

export function LoginPanel() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorPulse, setErrorPulse] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    const msg = searchParams.get("msg");
    setError(
      msg
        ? `Authentication failed: ${msg}`
        : "Authentication failed. Please try again."
    );
    setErrorPulse((n) => n + 1);
  }, [searchParams]);

  const handleXLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "x",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const isProviderDisabled =
          /provider is not enabled/i.test(error.message) ||
          /unsupported provider/i.test(error.message) ||
          /provider not found/i.test(error.message);
        // Fetch failed at the network layer = Supabase URL is unreachable.
        // Most common cause: project paused or deleted. Surface the
        // diagnosis instead of a generic "Connection failed".
        const isNetworkFailure =
          /fetch failed/i.test(error.message) ||
          /failed to fetch/i.test(error.message) ||
          /networkerror/i.test(error.message);
        setError(
          isProviderDisabled
            ? "X sign-in is temporarily unavailable. Please try again later."
            : isNetworkFailure
              ? "Auth server unreachable. The Supabase project may be paused or the URL is wrong — check NEXT_PUBLIC_SUPABASE_URL."
              : error.message
        );
        setErrorPulse((n) => n + 1);
        setLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const isNetworkFailure =
        /fetch failed/i.test(message) ||
        /failed to fetch/i.test(message) ||
        /networkerror/i.test(message);
      setError(
        isNetworkFailure
          ? "Auth server unreachable. The Supabase project may be paused — check NEXT_PUBLIC_SUPABASE_URL."
          : "Connection failed. Try again."
      );
      setErrorPulse((n) => n + 1);
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={depthIn}
      initial="hidden"
      animate="visible"
      className="relative border border-pulse-cyan/30 bg-void-black/85 p-5 shadow-[0_0_60px_rgba(0,240,255,0.12),inset_0_1px_0_rgba(0,240,255,0.12)] backdrop-blur-2xl sm:p-10"
    >
      {/* hairline top accent */}
      <span aria-hidden className="hairline absolute inset-x-0 top-0" />

      <motion.div variants={staggerFast} initial="hidden" animate="visible">
        {/* Logo */}
        <motion.div variants={fadeInUpSoft} className="mb-8 flex justify-center">
          <Logo />
        </motion.div>

        {/* Status line */}
        <motion.p
          variants={fadeInUpSoft}
          className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-pulse-cyan/70 sm:tracking-[0.3em]"
        >
          <span className="status-dot mr-2 align-middle" />
          Network online
        </motion.p>

        {/* Heading */}
        <motion.h1
          variants={fadeInUpSoft}
          className="mb-2 text-center font-headline text-2xl font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]"
        >
          Initialize<span className="text-pulse-cyan caret">.</span>
        </motion.h1>
        <motion.p
          variants={fadeInUpSoft}
          className="mb-8 text-center font-mono text-xs uppercase leading-relaxed tracking-[0.1em] text-neural-white/50 sm:tracking-[0.15em]"
        >
          Connect to enter the network
        </motion.p>

        {/* Auth Options */}
        <motion.div variants={fadeInUpSoft} className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleXLogin}
            disabled={loading}
            loading={loading}
          >
            <svg
              className="mr-3 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Connect with X
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ghost-gray to-ghost-gray" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/40">
              or
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-ghost-gray via-ghost-gray to-transparent" />
          </div>

          {/* Solana Wallet */}
          <WalletConnectButton />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key={errorPulse}
              variants={shake}
              initial="rest"
              animate="shake"
              exit={{ opacity: 0, y: -6 }}
              className="mt-4 border border-ember-orange/60 bg-ember-orange/10 p-3 shadow-[0_0_20px_rgba(255,107,53,0.25)]"
            >
              <p className="font-mono text-xs text-ember-orange">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          variants={fadeInUpSoft}
          className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/30 sm:tracking-[0.15em]"
        >
          Your identity begins here.
        </motion.p>

        {/* Browse-without-auth escape hatch. The whole /app shell is open to
            anonymous viewers — only mutations require login. Surface that
            here so users who landed on /login by accident don't think the
            app is gated. */}
        <motion.div
          variants={fadeInUpSoft}
          className="mt-4 flex items-center justify-center gap-3"
        >
          <span aria-hidden className="h-px w-8 bg-ghost-gray/40" />
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/45 transition-colors hover:text-pulse-cyan sm:tracking-[0.2em]"
          >
            <span>Browse without signing in</span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
          <span aria-hidden className="h-px w-8 bg-ghost-gray/40" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
