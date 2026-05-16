"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const FIELDS = [
  { id: "x_calls", label: "X calls / day" },
  { id: "anthropic_tokens", label: "Anthropic tokens / day" },
  { id: "consults", label: "Consults / day" },
  { id: "trainings", label: "Trainings / day" },
] as const;

type FieldId = (typeof FIELDS)[number]["id"];

interface UsageQuotaFormProps {
  userId: string;
  label: string;
  existing: Record<string, number>;
  onSuccess?: () => void;
}

export function UsageQuotaForm({
  userId,
  label,
  existing,
  onSuccess,
}: UsageQuotaFormProps) {
  const [values, setValues] = useState<Record<FieldId, string>>({
    x_calls: existing.x_calls?.toString() ?? "",
    anthropic_tokens: existing.anthropic_tokens?.toString() ?? "",
    consults: existing.consults?.toString() ?? "",
    trainings: existing.trainings?.toString() ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const overrides: Partial<Record<FieldId, number>> = {};
    for (const field of FIELDS) {
      const raw = values[field.id].trim();
      if (raw === "") continue;
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0) {
        setStatus(`Invalid value for ${field.label}.`);
        setLoading(false);
        return;
      }
      overrides[field.id] = Math.floor(num);
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/quota`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update quota");
      setStatus("Quota saved.");
      onSuccess?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update quota");
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
          Quota override · {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/55">
          Leave blank to use the default cap.
        </span>
      </div>
      {FIELDS.map((field) => (
        <label key={field.id} className="flex flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neural-white/40">
            {field.label}
          </span>
          <input
            type="number"
            min={0}
            value={values[field.id]}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
            }
            placeholder="default"
            className="w-32 border border-ghost-gray/30 bg-void-black px-3 py-2 font-mono text-xs text-neural-white/80 outline-none"
          />
        </label>
      ))}
      <Button
        type="submit"
        variant="primary"
        size="sm"
        magnetic={false}
        loading={loading}
        disabled={loading}
      >
        Save Quota
      </Button>
      {status ? (
        <span className="basis-full font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/55">
          {status}
        </span>
      ) : null}
    </form>
  );
}
