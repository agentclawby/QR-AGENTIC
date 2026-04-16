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
  const [status, setStatus] = useState<string | null>(null);

  const handleTrain = async () => {
    if (disabledReason) return;

    setLoading(true);
    setStatus(null);

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

      setStatus(data.summary || "Training completed.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Training failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/15 bg-void-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-headline text-xs font-bold uppercase tracking-[0.12em] text-neural-white">
            {module.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neural-white/55">
            {module.description}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
            {module.category} · +{module.sentience_boost} {module.sentience_dimension}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/25">
            Credits available: {creditsRemaining}
          </p>
          {disabledReason ? (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
              {disabledReason}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading || Boolean(disabledReason)}
          onClick={handleTrain}
        >
          {loading ? "Training..." : `${module.cost_credits} Credit`}
        </Button>
      </div>
      {status && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
          {status}
        </p>
      )}
    </div>
  );
}
