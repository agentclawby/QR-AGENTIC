"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ClaimXPostFormProps {
  agentId: string;
  draftId: string;
  alreadyClaimed?: { status: "approved" | "rejected" | "manual_review" } | null;
}

export function ClaimXPostForm({
  agentId,
  draftId,
  alreadyClaimed = null,
}: ClaimXPostFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "warn" | "err";
    message: string;
  } | null>(null);

  if (alreadyClaimed?.status === "approved") {
    return (
      <span className="border border-pulse-cyan/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-pulse-cyan">
        Credit awarded
      </span>
    );
  }
  if (alreadyClaimed?.status === "manual_review") {
    return (
      <span className="border border-signal-violet/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-signal-violet">
        Pending review
      </span>
    );
  }
  if (alreadyClaimed?.status === "rejected") {
    return (
      <span className="border border-ember-orange/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ember-orange">
        Claim rejected
      </span>
    );
  }

  const submit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/agents/${agentId}/drafts/${draftId}/claim-x-post`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tweet_url: url.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "err", message: data.error || "Claim failed" });
        return;
      }
      if (data.status === "approved") {
        setStatus({
          kind: "ok",
          message: "+1 credit awarded.",
        });
      } else if (data.status === "manual_review") {
        setStatus({
          kind: "warn",
          message: "Submitted for review (similarity below auto-approve).",
        });
      } else {
        setStatus({
          kind: "err",
          message: data.reason ?? "Claim rejected.",
        });
      }
      setOpen(false);
      setUrl("");
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "err",
        message: err instanceof Error ? err.message : "Claim failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan hover:text-pulse-cyan/80"
      >
        Earn 1 credit · Posted on X?
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://x.com/handle/status/..."
        className="min-w-[260px] flex-1 border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-xs text-neural-white/80 outline-none"
      />
      <Button
        variant="primary"
        size="sm"
        magnetic={false}
        onClick={submit}
        loading={loading}
        disabled={loading || !url.trim()}
      >
        Verify
      </Button>
      <Button
        variant="ghost"
        size="sm"
        magnetic={false}
        onClick={() => {
          setOpen(false);
          setUrl("");
        }}
      >
        Cancel
      </Button>
      {status ? (
        <span
          className={
            "basis-full font-mono text-[10px] uppercase tracking-[0.12em] " +
            (status.kind === "ok"
              ? "text-pulse-cyan"
              : status.kind === "warn"
                ? "text-signal-violet"
                : "text-ember-orange")
          }
        >
          {status.message}
        </span>
      ) : null}
    </div>
  );
}
