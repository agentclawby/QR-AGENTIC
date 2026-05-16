"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { describeConsultAccess } from "@/lib/agent-gates";
import type { UserCreditBalance } from "@/types";

interface ConsultAgentProps {
  agentId: string;
  tokenGateThreshold: number;
  disabledReason?: string | null;
  viewerCredits: UserCreditBalance | null;
  walletLinked: boolean;
  isOwner: boolean;
  // True when no user is signed in. Triggers a "Sign in to consult" CTA
  // instead of running the consult API call (which would 401 anyway).
  isAnonymous?: boolean;
  tokenHolder?: boolean;
  onAfterConsult?: () => void;
}

export function ConsultAgent({
  agentId,
  tokenGateThreshold,
  disabledReason = null,
  viewerCredits,
  walletLinked,
  isOwner,
  isAnonymous = false,
  tokenHolder = false,
  onAfterConsult,
}: ConsultAgentProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const access = describeConsultAccess({
    isOwner,
    tokenHolder,
    credits: viewerCredits,
  });

  const handleSubmit = async () => {
    if (disabledReason) return;
    // Anonymous viewers: bounce to /login with a return path so they land
    // back on this agent after authenticating.
    if (isAnonymous) {
      const returnTo =
        typeof window !== "undefined" ? window.location.pathname : `/app/agent/${agentId}`;
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (query.trim().length < 8) return;

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
        `Consultation published. Access: ${String(data.accessMode).replace(
          "_",
          " ",
        )}. Open the Activity tab to read the response.`,
      );
      router.refresh();
      onAfterConsult?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Consult failed");
    } finally {
      setLoading(false);
    }
  };

  const accessTone =
    access.mode === "blocked"
      ? "border-ember-orange/40 text-ember-orange"
      : access.mode === "credit"
        ? "border-signal-violet/40 text-signal-violet"
        : "border-pulse-cyan/40 text-pulse-cyan";

  // Anon visitors can ALWAYS click the button (no min-length / credit /
  // access-mode checks) — the click just redirects to /login. Signed-in
  // users get the regular gate stack.
  const submitDisabled = isAnonymous
    ? false
    : loading ||
      query.trim().length < 8 ||
      Boolean(disabledReason) ||
      access.mode === "blocked";

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-5 sm:p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h2 className="font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white sm:tracking-[0.15em]">
            Public Consultation
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
            Ask a question; the answer is published to the public feed for
            anyone with access to read.
          </p>
        </div>
        {tokenGateThreshold > 0 ? (
          <span className="shrink-0 border border-signal-violet/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-signal-violet sm:tracking-[0.12em]">
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex max-w-full flex-wrap items-center gap-2 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] ${accessTone}`}
        >
          Next: {access.label}
          <span className="text-neural-white/45">·</span>
          <span>{access.cost}</span>
        </span>
        {!walletLinked && tokenGateThreshold > 0 ? (
          <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
            Link a wallet to satisfy the {tokenGateThreshold.toLocaleString()}{" "}
            token gate.
          </span>
        ) : null}
        {disabledReason ? (
          <span className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
            {disabledReason}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/45 sm:tracking-[0.12em]">
          <input
            type="checkbox"
            checked={premium}
            onChange={(event) => setPremium(event.target.checked)}
            disabled={
              Boolean(disabledReason) ||
              access.mode === "owner" ||
              access.mode === "token_holder"
            }
            className="accent-pulse-cyan"
          />
          Use premium credit
        </label>
        <Button
          variant="primary"
          size="sm"
          disabled={submitDisabled}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          {isAnonymous
            ? "Sign In to Consult"
            : loading
              ? "Consulting..."
              : "Run Consultation"}
        </Button>
      </div>

      {status && (
        <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/55 sm:tracking-[0.12em]">
          {status}
        </p>
      )}
    </div>
  );
}
