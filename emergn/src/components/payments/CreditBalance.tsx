"use client";

import { useEffect, useState } from "react";
import type { UserCreditBalance } from "@/types";

// V1 ships in operator-paid mode: purchase controls are intentionally not
// rendered. We still fetch /api/payments/balance to display the user's current
// free / training credit grant in the header.

interface CreditBalanceResponse {
  credits: UserCreditBalance;
}

export function CreditBalance() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CreditBalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/balance");
      const payload = await response.json();
      if (response.ok) {
        setData(payload as CreditBalanceResponse);
        setError(null);
      } else {
        setError(payload?.error || "Credits unavailable");
      }
    } catch {
      setError("Credits unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
        Credits...
      </span>
    );
  }

  if (error || !data) {
    return (
      <button
        type="button"
        onClick={() => void load()}
        className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-ember-orange/80 hover:text-ember-orange sm:tracking-[0.12em]"
        title={error ?? undefined}
      >
        Credits retry
      </button>
    );
  }

  // Fallback for users on the old three-pool model (pre-migration-008): sum the
  // legacy buckets so the header still reflects an honest number.
  const credits = data.credits;
  const total =
    (credits.action_credits ?? 0) > 0
      ? credits.action_credits
      : (credits.training_credits ?? 0) +
        (credits.premium_credits ?? 0) +
        (credits.free_consults_remaining ?? 0);

  return (
    <span
      className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]"
      title="1 credit = 1 train / consult / content draft. X-retrain costs 2."
    >
      Credits {total}
    </span>
  );
}
