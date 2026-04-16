"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { WalletPortfolioSnapshot } from "@/types";

interface PortfolioResponse {
  snapshot: WalletPortfolioSnapshot;
  analysis: {
    title: string;
    content: string;
  };
  walletAddress: string;
}

interface PortfolioViewProps {
  agentId: string;
  walletAddress: string | null;
  disabledReason?: string | null;
}

export function PortfolioView({
  agentId,
  walletAddress,
  disabledReason = null,
}: PortfolioViewProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<PortfolioResponse | null>(null);

  const handleAnalyze = async () => {
    if (disabledReason) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze portfolio");
      }

      setResult(data as PortfolioResponse);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Portfolio analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
            Portfolio Analysis
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
            Read-only wallet analysis with concentration, exposure, and heuristic
            PnL estimates. This is investor-facing guidance, not accounting-grade reporting.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading || Boolean(disabledReason)}
          onClick={handleAnalyze}
        >
          {loading ? "Analyzing..." : "Analyze Wallet"}
        </Button>
      </div>

      <div className="mb-4 space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
        <p>
          Wallet source:{" "}
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "not linked"}
        </p>
        {disabledReason ? <p>{disabledReason}</p> : null}
      </div>

      {status && (
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-orange">
          {status}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Wallet Value" value={`$${result.snapshot.totalUsdValue.toFixed(2)}`} />
            <Metric
              label="Top 3 Concentration"
              value={`${result.snapshot.concentrationTop3Pct.toFixed(1)}%`}
            />
            <Metric
              label="Stablecoin Ratio"
              value={`${result.snapshot.stablecoinRatioPct.toFixed(1)}%`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Heuristic Cost Basis"
              value={`$${result.snapshot.estimatedCostBasisUsd.toFixed(2)}`}
            />
            <Metric
              label="Estimated Unrealized PnL"
              value={`$${result.snapshot.estimatedUnrealizedPnlUsd.toFixed(2)}`}
            />
            <Metric
              label="Estimated Realized PnL"
              value={`$${result.snapshot.estimatedRealizedPnlUsd.toFixed(2)}`}
            />
          </div>

          <div className="border border-ghost-gray/15 bg-void-black p-4">
            <p className="mb-2 font-headline text-xs font-bold uppercase tracking-[0.12em] text-pulse-cyan">
              {result.analysis.title}
            </p>
            <p className="text-sm leading-relaxed text-neural-white/70">
              {result.analysis.content}
            </p>
          </div>

          <div className="border border-ghost-gray/15 bg-void-black p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
              Top Holdings
            </p>
            <div className="space-y-2">
              {result.snapshot.holdings.slice(0, 6).map((holding) => (
                <div key={holding.mint} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-neural-white/60">
                    {holding.symbol}
                  </span>
                  <span className="font-mono text-xs text-neural-white/40">
                    ${holding.usdValue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/25">
            {result.snapshot.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ghost-gray/15 bg-void-black p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
        {label}
      </p>
      <p className="mt-1 font-mono text-base text-neural-white/75">{value}</p>
    </div>
  );
}
