import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTokenMarketSnapshot } from "@/lib/tokens/market";
import type { AgentToken } from "@/types";

export const metadata = {
  title: "Canary Tokens — EMERGN.",
};

export default async function TokensPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: tokens } = await admin
    .from("agent_tokens")
    .select("*, agent:agents(id, name, token_gate_threshold)")
    .eq("status", "launched")
    .order("created_at", { ascending: false })
    .limit(20);

  const enriched = await Promise.all(
    ((tokens ?? []) as Array<AgentToken & { agent?: { id: string; name: string; token_gate_threshold: number } }>).map(
      async (token) => ({
        token,
        market: await fetchTokenMarketSnapshot(token.token_mint),
      })
    )
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-headline text-2xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          Canary Tokens
        </h1>
        <p className="mt-1 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.1em]">
          Experimental allowlisted launches. Agent Passport remains the primary V1 identity primitive.
        </p>
      </div>

      <div className="space-y-4">
        {enriched.length > 0 ? (
          enriched.map(({ token, market }) => (
            <Link
              key={token.id}
              href={`/app/agent/${token.agent_id}`}
              className="block border border-ghost-gray/20 bg-ghost-gray/5 p-5 transition-colors hover:border-pulse-cyan/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.12em]">
                    {token.agent?.name ?? token.token_name}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
                    ${token.token_symbol} · {token.launch_platform}
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 sm:w-auto lg:grid-cols-4">
                  <TokenStat label="Price" value={formatMoney(market.priceUsd)} />
                  <TokenStat label="FDV" value={formatMoney(market.fdvUsd)} />
                  <TokenStat label="Liquidity" value={formatMoney(market.liquidityUsd)} />
                  <TokenStat label="Holders" value={formatCount(market.holders)} />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="border border-dashed border-ghost-gray/20 py-16 text-center">
            <p className="px-4 font-mono text-sm uppercase tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
              No launched agent tokens yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ghost-gray/15 bg-void-black px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/25 sm:tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs text-neural-white/70">{value}</p>
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
