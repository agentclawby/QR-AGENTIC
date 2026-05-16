"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { TrainingModule } from "@/types";

interface TrainingModuleCardProps {
  agentId: string;
  module: TrainingModule;
  disabledReason?: string | null;
  creditsRemaining: number;
}

export function TrainingModuleCard({
  agentId,
  module,
  disabledReason = null,
  creditsRemaining,
}: TrainingModuleCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const insufficientCredits = creditsRemaining < module.cost_credits;
  const effectiveDisabledReason =
    disabledReason ??
    (insufficientCredits
      ? `Need ${module.cost_credits} training credits; you have ${creditsRemaining}.`
      : null);

  const handleTrain = async () => {
    if (effectiveDisabledReason) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId: module.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Training failed");
      }

      setSummary(data.summary || "Training overlay applied.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/15 bg-void-black p-4">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="break-words font-headline text-xs font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.12em]">
            {module.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neural-white/55">
            {module.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em]">
            <span className="border border-ghost-gray/30 px-2 py-0.5 text-neural-white/50">
              {module.category}
            </span>
            <span className="border border-pulse-cyan/30 px-2 py-0.5 text-pulse-cyan">
              +{module.sentience_boost} {module.sentience_dimension}
            </span>
            <span className="border border-signal-violet/30 px-2 py-0.5 text-signal-violet">
              Cost {module.cost_credits} credit{module.cost_credits === 1 ? "" : "s"}
            </span>
          </div>
          {effectiveDisabledReason ? (
            <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/40 sm:tracking-[0.12em]">
              {effectiveDisabledReason}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading || Boolean(effectiveDisabledReason)}
          onClick={handleTrain}
          loading={loading}
          className="w-full sm:w-auto"
        >
          {`Train · ${module.cost_credits}`}
        </Button>
      </div>
      {summary ? (
        <div className="mt-3 border border-pulse-cyan/30 bg-pulse-cyan/[0.04] p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pulse-cyan/80 sm:tracking-[0.12em]">
            Training applied
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neural-white/65">
            {summary}
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
