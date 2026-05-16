"use client";

import { useEffect, useState } from "react";
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

interface XIngestCache {
  personality_traits: ExtractedPersonalityTraits;
  personality_overlay: string;
  usable_post_count: number;
}

interface XIngestResponse {
  success: boolean;
  rateLimited: boolean;
  retryAt?: string;
  cache: XIngestCache;
}

interface XIngestStreamEvent {
  type: "progress" | "complete" | "error";
  progress?: number;
  message?: string;
  error?: string;
  data?: XIngestResponse;
  usablePostCount?: number;
}

const X_VOICE_POST_LIMIT = 20;
const X_VOICE_MIN_USABLE_POSTS = 10;

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function errorFromPayload(data: { error?: string; usablePostCount?: number }) {
  if (typeof data.usablePostCount === "number") {
    return new Error(
      `Only ${data.usablePostCount} usable X posts were found. Import needs at least ${X_VOICE_MIN_USABLE_POSTS} authored posts.`
    );
  }

  return new Error(data.error || "Failed to import X personality");
}

function parseSseEvent(rawEvent: string): XIngestStreamEvent | null {
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return null;
  return JSON.parse(data) as XIngestStreamEvent;
}

async function readIngestStream(
  response: Response,
  onProgress: (event: XIngestStreamEvent) => void
) {
  if (!response.body) {
    throw new Error("X voice import did not return a progress stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: XIngestResponse | null = null;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      if (!rawEvent) continue;
      const event = parseSseEvent(rawEvent);
      if (!event) continue;

      if (event.type === "error") {
        throw errorFromPayload(event);
      }

      onProgress(event);

      if (event.type === "complete" && event.data) {
        result = event.data;
      }
    }

    if (done) break;
  }

  if (!result) {
    throw new Error("X voice import finished without a result.");
  }

  return result;
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState("Waiting to start");

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading]);

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
    setImportProgress(1);
    setImportStage("Starting X voice import");

    try {
      const response = await fetch("/api/x/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({ stream: true }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      let data: XIngestResponse;

      if (contentType.includes("text/event-stream")) {
        data = await readIngestStream(response, (event) => {
          if (typeof event.progress === "number") {
            setImportProgress(Math.max(0, Math.min(100, event.progress)));
          }
          if (event.message) {
            setImportStage(event.message);
          }
        });
      } else {
        const json = await response.json();
        if (!response.ok) {
          throw errorFromPayload(json);
        }
        data = json as XIngestResponse;
        setImportProgress(100);
        setImportStage("Voice overlay ready");
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
          ? data.retryAt
            ? `Using the cached import. You can refresh this voice overlay after ${new Date(
                data.retryAt
              ).toLocaleString()}.`
            : "Using the cached import."
          : "Voice overlay ready. Review the traits before you create the agent."
      );
      setImportProgress(100);
      setImportStage("Voice overlay ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <p className="font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.12em]">
              Import X Personality
            </p>
            <p className="mt-1 break-words font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
              {xHandle ? `Linked handle: @${xHandle}` : "Link an X account in Settings first"}
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/50 sm:tracking-[0.15em]">
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
          Pull up to {X_VOICE_POST_LIMIT} recent authored posts and replies,
          exclude pure retweets, and build a quick voice layer on top of the
          selected agent type. Needs at least {X_VOICE_MIN_USABLE_POSTS} usable
          posts; use Training later to fetch more X signal.
        </p>

        {disabledReason ? (
          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
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

        {loading && (
          <div className="mt-4 border border-pulse-cyan/25 bg-void-black/70 p-3 shadow-[inset_0_1px_0_rgba(0,240,255,0.08)]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em]">
              <span className="text-pulse-cyan">
                <span className="status-dot mr-2 align-middle" />
                {importStage}
              </span>
              <span className="text-neural-white/45">
                {formatDuration(elapsedSeconds)} elapsed · {importProgress}%
              </span>
            </div>

            <div
              className="h-2 overflow-hidden border border-pulse-cyan/20 bg-ghost-gray/20"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={importProgress}
              aria-label="X voice analysis progress"
            >
              <div
                className="h-full bg-pulse-cyan shadow-[0_0_18px_rgba(0,240,255,0.55)] transition-[width] duration-700 ease-out"
                style={{ width: `${importProgress}%` }}
              />
            </div>

            <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-neural-white/35 sm:tracking-[0.12em]">
              Progress updates when each backend checkpoint completes. AI voice
              extraction is usually the longest step.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-ember-orange sm:tracking-[0.12em]">
            {error}
          </p>
        )}

        {status && (
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-pulse-cyan sm:tracking-[0.12em]">
            {status}
          </p>
        )}
      </div>

      {enabled && traits && (
        <div className="border border-pulse-cyan/20 bg-pulse-cyan/5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-pulse-cyan sm:tracking-[0.18em]">
              Trait Preview
            </span>
            {usablePostCount !== null && (
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/40 sm:tracking-[0.12em]">
                {usablePostCount} posts analyzed
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
                Tone
              </p>
              <p className="text-sm text-neural-white/70">
                {traits.tone.join(", ")}
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
                Topics
              </p>
              <p className="text-sm text-neural-white/70">
                {traits.topicClusters.join(", ")}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neural-white/30 sm:tracking-[0.12em]">
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
