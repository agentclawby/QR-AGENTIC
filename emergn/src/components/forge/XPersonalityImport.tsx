"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CapabilityStatus, ExtractedPersonalityTraits } from "@/types";

interface XPersonalityImportProps {
  xHandle: string | null;
  capability: CapabilityStatus;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onImported: (payload: {
    overlay: string;
    traits: ExtractedPersonalityTraits;
    usablePostCount: number;
  }) => void;
}

export function XPersonalityImport({
  xHandle,
  capability,
  enabled,
  onEnabledChange,
  onImported,
}: XPersonalityImportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [traits, setTraits] = useState<ExtractedPersonalityTraits | null>(null);
  const [usablePostCount, setUsablePostCount] = useState<number | null>(null);

  const disabledReason =
    !capability.enabled
      ? capability.reason
      : !xHandle
        ? "Link an X account in Settings before importing a voice overlay."
        : null;

  const handleImport = async () => {
    if (disabledReason) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch("/api/x/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.usablePostCount === "number") {
          throw new Error(
            `Only ${data.usablePostCount} usable X posts were found. Import needs at least 25 authored posts.`
          );
        }

        throw new Error(data.error || "Failed to import X personality");
      }

      const cache = data.cache;
      setTraits(cache.personality_traits);
      setUsablePostCount(cache.usable_post_count);
      onImported({
        overlay: cache.personality_overlay,
        traits: cache.personality_traits,
        usablePostCount: cache.usable_post_count,
      });
      setStatus(
        data.rateLimited
          ? `Using the cached import. You can refresh this voice overlay after ${new Date(
              data.retryAt
            ).toLocaleString()}.`
          : "Voice overlay ready. Review the traits before you forge."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-headline text-sm font-bold uppercase tracking-[0.12em] text-neural-white">
              Import X Personality
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
              {xHandle ? `Linked handle: @${xHandle}` : "Link an X account in Settings first"}
            </p>
          </div>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/50">
            <input
              type="checkbox"
              className="accent-pulse-cyan"
              checked={enabled}
              disabled={Boolean(disabledReason)}
              onChange={(event) => onEnabledChange(event.target.checked)}
            />
            Enable
          </label>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neural-white/55">
          Pull up to 80 recent authored posts and replies, exclude pure retweets,
          and build a voice layer on top of the forged archetype. Import only runs
          when at least 25 usable posts are available.
        </p>

        {disabledReason ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
            {disabledReason}
          </p>
        ) : null}

        {enabled && !disabledReason && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? "Analyzing..." : traits ? "Refresh Import" : "Analyze X Voice"}
            </Button>
          </div>
        )}

        {error && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-orange">
            {error}
          </p>
        )}

        {status && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan">
            {status}
          </p>
        )}
      </div>

      {enabled && traits && (
        <div className="border border-pulse-cyan/20 bg-pulse-cyan/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-pulse-cyan">
              Trait Preview
            </span>
            {usablePostCount !== null && (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/40">
                {usablePostCount} posts analyzed
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
                Tone
              </p>
              <p className="text-sm text-neural-white/70">
                {traits.tone.join(", ")}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
                Topics
              </p>
              <p className="text-sm text-neural-white/70">
                {traits.topicClusters.join(", ")}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
                Cadence
              </p>
              <p className="text-sm text-neural-white/70">{traits.cadence}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
