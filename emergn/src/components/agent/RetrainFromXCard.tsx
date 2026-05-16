"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface RetrainFromXCardProps {
  agentId: string;
  xHandle: string | null;
  disabledReason?: string | null;
  creditsRemaining: number;
}

export function RetrainFromXCard({
  agentId,
  xHandle,
  disabledReason = null,
  creditsRemaining,
}: RetrainFromXCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRetrain = async () => {
    if (disabledReason) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/retrain-from-x`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Retrain failed");
      setSummary(data.summary || "Voice overlay refreshed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retrain failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-pulse-cyan/20 bg-pulse-cyan/[0.04] p-5">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
            Retrain on your latest X posts
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
            Fetch more X signal after the quick forge import. Pulls 40 recent
            posts and adds a fresh voice overlay on top of your existing
            training. Bumps Influence +5.
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
            {xHandle ? `Linked: @${xHandle}` : "No X account linked"} · Credits {creditsRemaining}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          magnetic={false}
          onClick={handleRetrain}
          disabled={loading || Boolean(disabledReason)}
          loading={loading}
          className="w-full sm:w-auto"
        >
          Retrain · 2 credits
        </Button>
      </div>
      {disabledReason ? (
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
          {disabledReason}
        </p>
      ) : null}
      {summary ? (
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
          {summary}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
