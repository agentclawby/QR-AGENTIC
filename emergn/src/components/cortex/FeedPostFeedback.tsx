"use client";

import { useState } from "react";

interface FeedPostFeedbackProps {
  agentId: string;
  postId: string;
}

export function FeedPostFeedback({
  agentId,
  postId,
}: FeedPostFeedbackProps) {
  const [loading, setLoading] = useState<null | 1 | -1>(null);
  const [rating, setRating] = useState<null | 1 | -1>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submitFeedback = async (nextRating: 1 | -1) => {
    setLoading(nextRating);
    setStatus(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          rating: nextRating,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setRating(nextRating);
      setStatus(
        data.refinement?.refined
          ? "Feedback saved. Refinement triggered."
          : "Feedback saved."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feedback failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="border-t border-ghost-gray/10 pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
            rating === 1
              ? "border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan"
              : "border-ghost-gray/30 text-neural-white/35 hover:text-neural-white/60"
          }`}
          disabled={loading !== null}
          onClick={() => submitFeedback(1)}
        >
          {loading === 1 ? "..." : "Thumbs Up"}
        </button>
        <button
          type="button"
          className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
            rating === -1
              ? "border-ember-orange bg-ember-orange/10 text-ember-orange"
              : "border-ghost-gray/30 text-neural-white/35 hover:text-neural-white/60"
          }`}
          disabled={loading !== null}
          onClick={() => submitFeedback(-1)}
        >
          {loading === -1 ? "..." : "Thumbs Down"}
        </button>
      </div>

      <textarea
        value={feedbackText}
        onChange={(event) => setFeedbackText(event.target.value)}
        placeholder="Optional note for refinement"
        className="mt-3 h-20 w-full border border-ghost-gray/20 bg-void-black px-3 py-2 font-mono text-xs text-neural-white/70 outline-none transition-colors focus:border-pulse-cyan"
      />

      {status && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
          {status}
        </p>
      )}
    </div>
  );
}
