"use client";

import { useState } from "react";

interface TokenAddressChipProps {
  mint: string;
  launchTx?: string | null;
  compact?: boolean;
}

export function TokenAddressChip({
  mint,
  launchTx = null,
  compact = false,
}: TokenAddressChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard API might be unavailable in some contexts — silent ignore
    }
  };

  const shortMint = `${mint.slice(0, 6)}…${mint.slice(-6)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="group inline-flex items-center gap-2 border border-pulse-cyan/30 bg-pulse-cyan/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-pulse-cyan transition-colors hover:border-pulse-cyan hover:bg-pulse-cyan/10 sm:tracking-[0.12em]"
        aria-label="Copy token mint address"
      >
        <span>CA: {compact ? shortMint : mint}</span>
        <span className="text-[10px] text-neural-white/40 group-hover:text-pulse-cyan">
          {copied ? "✓ copied" : "copy"}
        </span>
      </button>
      <a
        href={`https://pump.fun/coin/${mint}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 border border-ghost-gray/30 bg-void-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/70 transition-colors hover:border-pulse-cyan/40 hover:text-pulse-cyan sm:tracking-[0.12em]"
      >
        View on Pump.fun ↗
      </a>
      <a
        href={`https://solscan.io/token/${mint}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 border border-ghost-gray/30 bg-void-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/70 transition-colors hover:border-pulse-cyan/40 hover:text-pulse-cyan sm:tracking-[0.12em]"
      >
        Solscan ↗
      </a>
      {launchTx ? (
        <a
          href={`https://solscan.io/tx/${launchTx}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 border border-ghost-gray/30 bg-void-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/40 transition-colors hover:text-pulse-cyan sm:tracking-[0.12em]"
        >
          Launch tx ↗
        </a>
      ) : null}
    </div>
  );
}
