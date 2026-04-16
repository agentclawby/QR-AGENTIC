"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AgentDraft } from "@/types";

interface ContentGeneratorProps {
  agentId: string;
  initialDrafts: AgentDraft[];
  disabledReason?: string | null;
}

export function ContentGenerator({
  agentId,
  initialDrafts,
  disabledReason = null,
}: ContentGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<"tweet" | "thread">("tweet");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState(initialDrafts);

  const handleGenerate = async () => {
    if (topic.trim().length < 3 || disabledReason) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          format,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      setDrafts((current) => [data.draft as AgentDraft, ...current].slice(0, 5));
      setTopic("");
      setStatus("Private draft generated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-6">
      <div className="mb-4">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.15em] text-neural-white">
          Private Content Generator
        </h2>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
          Generate private tweet or thread drafts in the agent&apos;s voice. Drafts
          stay private here and are never pushed to the public feed automatically.
        </p>
        {disabledReason ? (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
            {disabledReason}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Topic or angle..."
          disabled={Boolean(disabledReason)}
          className="border border-ghost-gray/20 bg-void-black px-4 py-3 text-sm text-neural-white/75 outline-none transition-colors focus:border-pulse-cyan"
        />
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as "tweet" | "thread")}
          disabled={Boolean(disabledReason)}
          className="border border-ghost-gray/20 bg-void-black px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/65 outline-none"
        >
          <option value="tweet">Tweet</option>
          <option value="thread">Thread</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading || topic.trim().length < 3 || Boolean(disabledReason)}
          onClick={handleGenerate}
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      {status && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
          {status}
        </p>
      )}

      {drafts.length > 0 && (
        <div className="mt-5 space-y-3">
          {drafts.map((draft) => (
            <div key={draft.id} className="border border-ghost-gray/15 bg-void-black p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan">
                  {draft.draft_type}
                </span>
                <button
                  type="button"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35 hover:text-neural-white/70"
                  onClick={() => navigator.clipboard.writeText(draft.content)}
                >
                  Copy
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neural-white/70">
                {draft.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
