"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SystemCapabilities, SystemHealth } from "@/types";

interface CapabilitiesResponse {
  capabilities: SystemCapabilities;
  health?: SystemHealth;
  linkedAccounts?: {
    walletAddress: string | null;
    xHandle: string | null;
  };
}

const CAPABILITY_LABELS: Record<keyof SystemCapabilities, string> = {
  anthropic: "Anthropic",
  x_import: "X Import",
  portfolio_analysis: "Portfolio",
  agent_passport: "Agent Passport",
  passport_image: "Passport Image",
  payments: "Payments",
  token_launch: "Token Launch",
};

// Non-technical hints surfaced to admins for capabilities that aren't ready.
// We deliberately don't expose env var names here — those are an operator
// concern, not a user-facing detail, and they leak the integration stack to
// anyone with access to this panel.
const CAPABILITY_USER_HINTS: Record<keyof SystemCapabilities, string> = {
  anthropic: "Awaiting operator setup.",
  x_import: "Awaiting operator setup.",
  portfolio_analysis: "Awaiting operator setup.",
  agent_passport: "Link a Solana wallet in Settings to enable.",
  passport_image: "Visual rendering is temporarily disabled — passports still issue.",
  payments: "Operator-paid in V1.",
  token_launch: "In limited preview.",
};

const TABLE_LABELS: Record<keyof SystemHealth["migrationsApplied"], string> = {
  profiles: "profiles",
  agents: "agents",
  sentience_scores: "sentience_scores",
  user_credit_balances: "user_credit_balances",
  agent_passports: "agent_passports",
};

export function IntegrationReadiness() {
  const [data, setData] = useState<CapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system/capabilities", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (response.ok) {
        setData(payload as CapabilitiesResponse);
        setError(null);
      } else {
        setError(payload?.error || "Failed to load system status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
          Loading system status...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-ember-orange/30 bg-ember-orange/5 p-5 sm:p-6">
        <p className="font-mono text-xs text-ember-orange">
          {error ?? "System status unavailable"}
        </p>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const { capabilities, health } = data;

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
          Integration Readiness
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/40 hover:text-pulse-cyan sm:tracking-[0.12em]"
        >
          Refresh
        </button>
      </div>

      {/* DB / migrations health */}
      {health && (
        <div className="mb-6 border border-ghost-gray/10 bg-void-black p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-neural-white/60 sm:tracking-[0.1em]">
              Database
            </p>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] ${
                health.db === "ok" ? "text-pulse-cyan" : "text-ember-orange"
              }`}
            >
              {health.db === "ok" ? "Healthy" : "Degraded"}
            </span>
          </div>
          <ul className="space-y-1 font-mono text-[11px]">
            {(Object.keys(TABLE_LABELS) as (keyof typeof TABLE_LABELS)[]).map(
              (key) => {
                const ok = health.migrationsApplied[key];
                return (
                  <li
                    key={key}
                    className="flex min-w-0 items-center justify-between gap-3"
                  >
                    <span className="min-w-0 truncate text-neural-white/55">
                      {TABLE_LABELS[key]}
                    </span>
                    <span
                      className={
                        ok ? "text-pulse-cyan" : "text-ember-orange"
                      }
                    >
                      {ok ? "✓" : "missing"}
                    </span>
                  </li>
                );
              }
            )}
            <li className="flex items-center justify-between gap-3 border-t border-ghost-gray/10 pt-1">
              <span className="text-neural-white/55">profile row</span>
              <span
                className={
                  health.profileExists ? "text-pulse-cyan" : "text-ember-orange"
                }
              >
                {health.profileExists ? "✓" : "missing"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-neural-white/55">credits row</span>
              <span
                className={
                  health.creditsExist ? "text-pulse-cyan" : "text-neural-white/30"
                }
              >
                {health.creditsExist ? "✓" : "lazy-created on demand"}
              </span>
            </li>
          </ul>
          {health.notes.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-ghost-gray/10 pt-2 font-mono text-[10px] text-ember-orange/80">
              {health.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-3">
        {(Object.entries(capabilities) as [
          keyof SystemCapabilities,
          SystemCapabilities[keyof SystemCapabilities],
        ][]).map(([key, capability]) => {
          // V1 ships in operator-paid mode — payments is intentionally
          // disabled. Render it as informational, not as an error.
          const isOperatorPaid = key === "payments" && !capability.enabled;
          const accentReady = capability.enabled || isOperatorPaid;
          const statusLabel = capability.enabled
            ? "Ready"
            : isOperatorPaid
              ? "Operator-paid V1"
              : "Unavailable";
          const description = capability.enabled
            ? "Configured and ready to use."
            : isOperatorPaid
              ? "V1 is operator-paid; purchases are disabled."
              : capability.reason;

          return (
            <div
              key={key}
              className="border border-ghost-gray/10 bg-void-black p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-neural-white/60 sm:tracking-[0.1em]">
                  {CAPABILITY_LABELS[key]}
                </p>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] ${
                    accentReady ? "text-pulse-cyan" : "text-ember-orange"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neural-white/45">
                {description}
              </p>
              {!capability.enabled && !isOperatorPaid && (
                <p className="mt-1 break-words font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/30 sm:tracking-[0.1em]">
                  {CAPABILITY_USER_HINTS[key]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
