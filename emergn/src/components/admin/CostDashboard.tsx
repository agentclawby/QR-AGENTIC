"use client";

import { useEffect, useState } from "react";

interface BudgetWarning {
  provider: string;
  level: "ok" | "warn" | "critical";
  used: number;
  limit: number;
  unit: string;
  message: string;
}

interface CostSummary {
  today: { x_calls: number; anthropic_tokens: number; consults: number; trainings: number };
  last7: { x_calls: number; anthropic_tokens: number; consults: number; trainings: number };
  topUsers: Array<{
    user_id: string;
    anthropic_tokens: number;
    x_calls: number;
    trainings: number;
    consults: number;
  }>;
  cost: {
    today_usd: number;
    last_7d_usd: number;
    per_1k_tokens_usd: number;
    monthly_budget_usd: number | null;
  };
  warnings: BudgetWarning[];
}

export function CostDashboard() {
  const [data, setData] = useState<CostSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/cost-summary")
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load");
        if (!cancelled) setData(payload as CostSummary);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
        <p className="font-mono text-xs text-ember-orange">
          Cost summary error: {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-16 border border-ghost-gray/15 bg-ghost-gray/5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.warnings.length > 0 ? (
        <div className="space-y-2">
          {data.warnings.map((warning) => {
            const tone =
              warning.level === "critical"
                ? "border-ember-orange/60 bg-ember-orange/10 text-ember-orange"
                : "border-yellow-500/40 bg-yellow-500/5 text-yellow-300";
            return (
              <div
                key={`${warning.provider}-${warning.level}`}
                className={`flex flex-wrap items-center justify-between gap-3 border px-4 py-3 ${tone}`}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em]">
                    {warning.level === "critical"
                      ? "ACTION REQUIRED"
                      : "BUDGET WARNING"}{" "}
                    · {warning.provider}
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {warning.message}
                  </p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em]">
                  {warning.used} / {warning.limit} {warning.unit}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Today (USD)" value={`$${data.cost.today_usd.toFixed(2)}`} />
        <Stat label="7d (USD)" value={`$${data.cost.last_7d_usd.toFixed(2)}`} />
        <Stat label="Tokens today" value={data.today.anthropic_tokens.toLocaleString()} />
        <Stat label="X calls today" value={data.today.x_calls.toLocaleString()} />
      </div>

      {data.cost.monthly_budget_usd ? (
        <BudgetBar
          label={`Anthropic monthly budget · $${data.cost.monthly_budget_usd.toFixed(0)}`}
          used={data.cost.last_7d_usd * (30 / 7)}
          limit={data.cost.monthly_budget_usd}
          unit="USD"
        />
      ) : null}

      {data.topUsers.length > 0 ? (
        <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
            Top spenders (7d)
          </p>
          <ul className="space-y-1 font-mono text-[11px] tabular-nums text-neural-white/70">
            {data.topUsers.slice(0, 5).map((u) => (
              <li key={u.user_id} className="flex justify-between gap-3">
                <span>{u.user_id.slice(0, 8)}</span>
                <span className="text-pulse-cyan">
                  {u.anthropic_tokens.toLocaleString()} tokens
                </span>
                <span className="text-neural-white/45">
                  {u.x_calls} X · {u.trainings} train · {u.consults} consult
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/40">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg tabular-nums text-pulse-cyan">
        {value}
      </p>
    </div>
  );
}

function BudgetBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const ratio = Math.min(1, used / limit);
  const tone =
    ratio >= 0.9
      ? "bg-ember-orange"
      : ratio >= 0.7
        ? "bg-yellow-400"
        : "bg-pulse-cyan";
  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 px-4 py-3">
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/55">
        <span>{label}</span>
        <span>
          {used.toFixed(2)} / {limit.toFixed(2)} {unit} ({(ratio * 100).toFixed(0)}%)
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden bg-ghost-gray/30">
        <div
          className={`h-full transition-all duration-700 ${tone}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
