"use client";

import { useEffect, useState } from "react";

interface TokenInfoResponse {
  token: {
    token_mint: string;
    token_symbol: string;
    token_name: string;
    status: string;
    launch_tx: string | null;
  };
  market: {
    priceUsd: number | null;
    fdvUsd: number | null;
    liquidityUsd: number | null;
    holders: number | null;
    volume24hUsd: number | null;
  };
  tokenGateThreshold: number;
}

interface TokenInfoProps {
  agentId: string;
}

export function TokenInfo({ agentId }: TokenInfoProps) {
  const [data, setData] = useState<TokenInfoResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/agents/${agentId}/token`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as TokenInfoResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (!data) return null;

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
            Agent Token
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
            {data.token.token_name} (${data.token.token_symbol})
          </p>
        </div>
        <span className="border border-pulse-cyan/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan">
          {data.token.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TokenMetric label="Price" value={formatMoney(data.market.priceUsd)} />
        <TokenMetric label="FDV" value={formatMoney(data.market.fdvUsd)} />
        <TokenMetric label="Liquidity" value={formatMoney(data.market.liquidityUsd)} />
        <TokenMetric label="Holders" value={formatCount(data.market.holders)} />
      </div>

      <div className="mt-4 space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
        <p>Mint: {shorten(data.token.token_mint)}</p>
        {data.token.launch_tx ? <p>Launch Tx: {shorten(data.token.launch_tx)}</p> : null}
        <p>Gate Threshold: {data.tokenGateThreshold.toLocaleString()}</p>
      </div>
    </div>
  );
}

function TokenMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ghost-gray/15 bg-void-black p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
        {label}
      </p>
      <p className="mt-1 font-mono text-base text-neural-white/75">{value}</p>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value === null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatCount(value: number | null) {
  if (value === null) return "—";
  return value.toLocaleString();
}

function shorten(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
