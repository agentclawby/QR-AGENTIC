"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { UserCreditBalance } from "@/types";

interface ConsultAgentProps {
  agentId: string;
  tokenGateThreshold: number;
  disabledReason?: string | null;
  viewerCredits: UserCreditBalance | null;
  walletLinked: boolean;
}

export function ConsultAgent({
  agentId,
  tokenGateThreshold,
  disabledReason = null,
  viewerCredits,
  walletLinked,
}: ConsultAgentProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (query.trim().length < 8 || disabledReason) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/consult`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          isPremium: premium,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to consult agent");
      }

      setQuery("");
      setStatus(
        `Consultation published to the public feed. Access: ${String(
          data.accessMode
        ).replace("_", " ")}.`
      );
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Consult failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
            Public Consultation
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
            Ask a question and publish the answer to the public feed. Anyone who
            can access this agent will be able to read the finished consultation.
          </p>
        </div>
        {tokenGateThreshold > 0 ? (
          <span className="border border-signal-violet/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-violet">
            Gate: {tokenGateThreshold.toLocaleString()}
          </span>
        ) : null}
      </div>

      <textarea
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Analyze the current thesis for SOL vs majors over the next 2-4 weeks..."
        disabled={Boolean(disabledReason)}
        className="h-28 w-full border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none transition-colors focus:border-pulse-cyan"
      />

      <div className="mt-3 space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
        <p>
          Free consults left today: {viewerCredits?.free_consults_remaining ?? 0}
          {" "}· Premium credits: {viewerCredits?.premium_credits ?? 0}
        </p>
        {!walletLinked && tokenGateThreshold > 0 ? (
          <p>Link a wallet if you want agent-token access checks to work.</p>
        ) : null}
        {disabledReason ? <p>{disabledReason}</p> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/45">
          <input
            type="checkbox"
            checked={premium}
            onChange={(event) => setPremium(event.target.checked)}
            disabled={Boolean(disabledReason)}
            className="accent-pulse-cyan"
          />
          Use premium access if needed
        </label>
        <Button
          variant="primary"
          size="sm"
          disabled={loading || query.trim().length < 8 || Boolean(disabledReason)}
          onClick={handleSubmit}
        >
          {loading ? "Consulting..." : "Run Consultation"}
        </Button>
      </div>

      {status && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
          {status}
        </p>
      )}
    </div>
  );
}
