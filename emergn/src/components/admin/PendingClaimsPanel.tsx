"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export interface PendingClaim {
  id: string;
  user_id: string;
  draft_id: string;
  tweet_id: string;
  tweet_url: string;
  similarity: number;
  reason: string | null;
  created_at: string;
}

interface PendingClaimsPanelProps {
  claims: PendingClaim[];
}

export function PendingClaimsPanel({ claims }: PendingClaimsPanelProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (
    claim: PendingClaim,
    status: "approved" | "rejected",
  ) => {
    setPendingId(claim.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update claim");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update claim");
    } finally {
      setPendingId(null);
    }
  };

  if (claims.length === 0) {
    return (
      <div className="border border-dashed border-ghost-gray/30 px-4 py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/40">
          No claims awaiting review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="border border-ember-orange/30 bg-ember-orange/5 p-3">
          <p className="font-mono text-xs text-ember-orange">{error}</p>
        </div>
      ) : null}
      {claims.map((claim) => (
        <div
          key={claim.id}
          className="flex flex-wrap items-center justify-between gap-3 border border-ghost-gray/20 bg-void-black px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <a
              href={claim.tweet_url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-pulse-cyan hover:text-pulse-cyan/80"
            >
              {claim.tweet_url}
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/45">
              user {claim.user_id.slice(0, 8)} · similarity{" "}
              {(claim.similarity * 100).toFixed(0)}%{" "}
              · {new Date(claim.created_at).toLocaleString()}
            </span>
            {claim.reason ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
                {claim.reason}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              magnetic={false}
              loading={pendingId === claim.id}
              disabled={pendingId === claim.id}
              onClick={() => decide(claim, "approved")}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              magnetic={false}
              loading={pendingId === claim.id}
              disabled={pendingId === claim.id}
              onClick={() => decide(claim, "rejected")}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
