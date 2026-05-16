"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface GrantCreditsFormProps {
  userId: string;
  label: string;
  onSuccess?: () => void;
}

export function GrantCreditsForm({
  userId,
  label,
  onSuccess,
}: GrantCreditsFormProps) {
  const [amount, setAmount] = useState("5");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatus("Enter a positive integer amount.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/credits/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          type: "action",
          amount: Math.floor(numericAmount),
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant credits");
      setStatus(`Granted. New balance: ${data.credits?.action_credits ?? "?"}`);
      setNote("");
      onSuccess?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to grant credits");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 border border-ghost-gray/20 bg-ghost-gray/5 p-4"
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/40">
          Grant credits to
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-pulse-cyan">
          {label}
        </span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/40">
          Amount
        </span>
        <input
          type="number"
          min={1}
          max={50}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-28 border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-xs text-neural-white/80 outline-none"
        />
      </label>

      <label className="flex min-w-[200px] flex-1 flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/40">
          Note (optional)
        </span>
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={280}
          placeholder="Reason for grant..."
          className="border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-xs text-neural-white/75 outline-none"
        />
      </label>

      <Button
        variant="primary"
        size="sm"
        type="submit"
        magnetic={false}
        disabled={loading}
        loading={loading}
      >
        Grant
      </Button>

      {status ? (
        <span className="basis-full font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/55">
          {status}
        </span>
      ) : null}
    </form>
  );
}
