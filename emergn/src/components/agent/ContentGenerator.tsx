"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ClaimXPostForm } from "@/components/agent/ClaimXPostForm";
import { cn } from "@/lib/utils";
import type { AgentDraft } from "@/types";

interface DraftMetadata {
  title?: string;
  notes?: string;
  published?: boolean;
  published_post_id?: string;
  published_at?: string;
  claimed_credit?: {
    tweet_id: string;
    awarded_at: string;
    status: "approved" | "rejected" | "manual_review";
  };
  intent?: string;
  in_reply_to_tweet_id?: string | null;
  target_author?: string | null;
}

interface ContentGeneratorProps {
  agentId: string;
  initialDrafts: AgentDraft[];
  disabledReason?: string | null;
  xHandle?: string | null;
  onPublished?: () => void;
}

type Mode = "tweet" | "thread" | "reply";

type ReplyIntent =
  | "freeform"
  | "agree"
  | "disagree"
  | "add-context"
  | "ask-question"
  | "thank";

interface ModeMeta {
  id: Mode;
  glyph: string;
  code: string;
  label: string;
  description: string;
  accent: "cyan" | "violet" | "orange";
}

const MODES: ModeMeta[] = [
  {
    id: "tweet",
    glyph: "◇",
    code: "BROADCAST.01",
    label: "Tweet",
    description: "Single-shot post in your voice.",
    accent: "cyan",
  },
  {
    id: "thread",
    glyph: "≡",
    code: "CHAIN.02",
    label: "Thread",
    description: "Multi-part chain on a topic.",
    accent: "violet",
  },
  {
    id: "reply",
    glyph: "↩",
    code: "REPLY.03",
    label: "Reply",
    description: "In-thread response to a target tweet.",
    accent: "orange",
  },
];

const ACCENT_TOKENS: Record<
  ModeMeta["accent"],
  {
    border: string;
    bg: string;
    text: string;
    shadow: string;
    glow: string;
    activeBg: string;
  }
> = {
  cyan: {
    border: "border-pulse-cyan/40",
    bg: "bg-pulse-cyan/[0.05]",
    text: "text-pulse-cyan",
    shadow: "shadow-[0_0_24px_rgba(0,240,255,0.28),inset_0_1px_0_rgba(0,240,255,0.18)]",
    glow: "bg-pulse-cyan shadow-[0_0_10px_rgba(0,240,255,0.7)]",
    activeBg: "bg-pulse-cyan/[0.1]",
  },
  violet: {
    border: "border-signal-violet/40",
    bg: "bg-signal-violet/[0.06]",
    text: "text-signal-violet",
    shadow: "shadow-[0_0_24px_rgba(139,92,246,0.3),inset_0_1px_0_rgba(139,92,246,0.18)]",
    glow: "bg-signal-violet shadow-[0_0_10px_rgba(139,92,246,0.7)]",
    activeBg: "bg-signal-violet/[0.1]",
  },
  orange: {
    border: "border-ember-orange/40",
    bg: "bg-ember-orange/[0.06]",
    text: "text-ember-orange",
    shadow: "shadow-[0_0_24px_rgba(255,107,53,0.3),inset_0_1px_0_rgba(255,107,53,0.18)]",
    glow: "bg-ember-orange shadow-[0_0_10px_rgba(255,107,53,0.7)]",
    activeBg: "bg-ember-orange/[0.1]",
  },
};

const REPLY_INTENTS: Array<{ id: ReplyIntent; label: string }> = [
  { id: "freeform", label: "Freeform" },
  { id: "agree", label: "Agree + sharpen" },
  { id: "disagree", label: "Push back" },
  { id: "add-context", label: "Add context" },
  { id: "ask-question", label: "Ask a question" },
  { id: "thank", label: "Thank + add value" },
];

function parseTweetUrl(input: string): {
  id: string | null;
  author: string | null;
} {
  const trimmed = input.trim();
  if (!trimmed) return { id: null, author: null };
  try {
    const url = new URL(trimmed);
    if (!/(?:^|\.)(twitter|x)\.com$/i.test(url.hostname)) {
      return { id: null, author: null };
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const statusIdx = parts.findIndex(
      (segment) => segment.toLowerCase() === "status"
    );
    if (statusIdx === -1) return { id: null, author: null };
    const author = parts[statusIdx - 1] ?? null;
    const id = parts[statusIdx + 1] ?? null;
    if (id && /^[0-9]{1,32}$/.test(id)) {
      return { id, author: author ?? null };
    }
  } catch {
    // not a URL — fall through
  }
  return { id: null, author: null };
}

export function ContentGenerator({
  agentId,
  initialDrafts,
  disabledReason = null,
  xHandle = null,
  onPublished,
}: ContentGeneratorProps) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("tweet");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [postingToXId, setPostingToXId] = useState<string | null>(null);
  const [previewDraftId, setPreviewDraftId] = useState<string | null>(null);

  const [topic, setTopic] = useState("");

  const [replyInput, setReplyInput] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replyTargetTweet, setReplyTargetTweet] = useState("");
  const [replyTweetId, setReplyTweetId] = useState<string | null>(null);
  const [replyIntent, setReplyIntent] = useState<ReplyIntent>("freeform");
  const [replyNotes, setReplyNotes] = useState("");

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];
  const activeTokens = ACCENT_TOKENS[activeMode.accent];

  const handleReplyInputChange = (value: string) => {
    setReplyInput(value);
    const looksLikeUrl = /(twitter|x)\.com\//i.test(value);
    if (looksLikeUrl) {
      const { id, author } = parseTweetUrl(value);
      setReplyTweetId(id);
      if (author && !replyAuthor) setReplyAuthor(author);
    } else {
      setReplyTargetTweet(value);
      setReplyTweetId(null);
    }
  };

  const handlePostToX = async (draft: AgentDraft) => {
    if (postingToXId) return;
    setPostingToXId(draft.id);
    setStatus(null);
    const meta = (draft.metadata ?? {}) as DraftMetadata;
    try {
      const res = await fetch(`/api/agents/${agentId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft.content,
          draftId: draft.id,
          inReplyToTweetId: meta.in_reply_to_tweet_id ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 412) {
          throw new Error("Sign in with X to enable posting from this account.");
        }
        throw new Error(data.error || "Failed to post to X");
      }
      setStatus(
        data.status === "scheduled"
          ? "Scheduled for X."
          : "Posted to X successfully."
      );
      setPreviewDraftId(null);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Post to X failed");
    } finally {
      setPostingToXId(null);
    }
  };

  const handleGenerate = async () => {
    if (disabledReason) return;

    if (mode === "reply") {
      const target = (replyTargetTweet || replyInput).trim();
      if (target.length < 3) {
        setStatus("// paste the tweet text or URL you want to reply to");
        return;
      }
      setLoading(true);
      setStatus(null);
      try {
        const response = await fetch(`/api/agents/${agentId}/generate-reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetTweet: target,
            targetAuthor: replyAuthor.trim() || null,
            inReplyToTweetId: replyTweetId ?? undefined,
            intent: replyIntent,
            extraNotes: replyNotes.trim() || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to draft reply");
        }
        setDrafts((current) => [data.draft as AgentDraft, ...current].slice(0, 5));
        setReplyInput("");
        setReplyTargetTweet("");
        setReplyTweetId(null);
        setReplyNotes("");
        setStatus(
          replyTweetId
            ? "Reply drafted — posting will send a real in-thread reply."
            : "Reply drafted — without a tweet URL, posting will create a standalone tweet."
        );
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Reply generation failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (topic.trim().length < 3) return;

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          format: mode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      setDrafts((current) => [data.draft as AgentDraft, ...current].slice(0, 5));
      setTopic("");
      setStatus("Private draft generated. Review below and publish when ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (draft: AgentDraft) => {
    setPublishingId(draft.id);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/agents/${agentId}/drafts/${draft.id}/publish`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setDrafts((current) =>
        current.map((d) =>
          d.id === draft.id
            ? {
                ...d,
                metadata: {
                  ...(d.metadata ?? {}),
                  published: true,
                  published_post_id: data.postId,
                  published_at: new Date().toISOString(),
                } as Record<string, unknown>,
              }
            : d,
        ),
      );
      setStatus(
        data.alreadyPublished
          ? "Already published earlier."
          : "Draft posted to the public feed.",
      );
      router.refresh();
      onPublished?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── HEADER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6"
      >
        <span aria-hidden className="hairline absolute inset-x-0 top-0" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pulse-cyan/80">
              <span className="status-dot mr-2 align-middle" />
              {"// CONTENT_LAYER :: DRAFT"}
            </p>
            <h2 className="mt-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
              Generator<span className={cn("caret", activeTokens.text)}>.</span>
            </h2>
            <p className="mt-1 max-w-xl font-mono text-[11px] leading-relaxed text-neural-white/55">
              Drafts stay private until you publish. Reply mode posts a real
              in-thread reply when a tweet URL is provided. {disabledReason}
            </p>
          </div>

          {/* mode segmented selector */}
          <div className="relative grid grid-cols-3 gap-2 sm:auto-rows-fr">
            {MODES.map((m) => {
              const tokens = ACCENT_TOKENS[m.accent];
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  disabled={Boolean(disabledReason)}
                  title={m.description}
                  className={cn(
                    "group relative flex min-w-[88px] flex-col items-center justify-center gap-1 border px-3 py-2.5 transition-colors",
                    active
                      ? `${tokens.border} ${tokens.activeBg} ${tokens.shadow}`
                      : "border-ghost-gray/40 hover:border-pulse-cyan/30",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  aria-pressed={active}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "font-mono text-lg leading-none transition-colors",
                      active ? tokens.text : "text-neural-white/40 group-hover:text-pulse-cyan/70"
                    )}
                  >
                    {m.glyph}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-[0.15em]",
                      active ? tokens.text : "text-neural-white/45"
                    )}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ─── INPUT PANEL ─────────────────────────────────── */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden border bg-ghost-gray/5 p-5 sm:p-6",
          activeTokens.border,
          activeTokens.bg
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            activeMode.accent === "cyan"
              ? "bg-gradient-to-r from-transparent via-pulse-cyan/70 to-transparent"
              : activeMode.accent === "violet"
                ? "bg-gradient-to-r from-transparent via-signal-violet/70 to-transparent"
                : "bg-gradient-to-r from-transparent via-ember-orange/70 to-transparent"
          )}
        />

        <div className="mb-4 flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center border font-mono text-sm",
              activeTokens.border,
              activeTokens.text,
              activeMode.accent === "cyan"
                ? "shadow-[0_0_8px_rgba(0,240,255,0.55)]"
                : activeMode.accent === "violet"
                  ? "shadow-[0_0_8px_rgba(139,92,246,0.55)]"
                  : "shadow-[0_0_8px_rgba(255,107,53,0.55)]"
            )}
          >
            {activeMode.glyph}
          </span>
          <div className="min-w-0">
            <p className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", activeTokens.text)}>
              {activeMode.code}
            </p>
            <p className="font-mono text-[11px] text-neural-white/55">
              {activeMode.description}
            </p>
          </div>
        </div>

        {mode === "reply" ? (
          <ReplyInput
            replyInput={replyInput}
            onReplyInputChange={handleReplyInputChange}
            replyTweetId={replyTweetId}
            replyAuthor={replyAuthor}
            onReplyAuthorChange={setReplyAuthor}
            replyTargetTweet={replyTargetTweet}
            onReplyTargetTweetChange={setReplyTargetTweet}
            replyIntent={replyIntent}
            onReplyIntentChange={setReplyIntent}
            replyNotes={replyNotes}
            onReplyNotesChange={setReplyNotes}
            disabled={Boolean(disabledReason)}
            loading={loading}
            onGenerate={handleGenerate}
          />
        ) : (
          <TopicInput
            topic={topic}
            onTopicChange={setTopic}
            disabled={Boolean(disabledReason)}
            loading={loading}
            onGenerate={handleGenerate}
            mode={mode}
          />
        )}

        <AnimatePresence>
          {status ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-pulse-cyan"
            >
              {status}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* ─── DRAFTS ──────────────────────────────────────── */}
      {drafts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
              <span className="status-dot mr-2 align-middle" />
              DRAFT_BUFFER · {drafts.length}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
              Last 5 retained
            </p>
          </div>

          <AnimatePresence initial={false}>
            {drafts.map((draft) => {
              const meta = (draft.metadata ?? {}) as DraftMetadata;
              const isPublished = Boolean(meta.published);
              const isReply = draft.draft_type === "reply";
              const draftAccent: ModeMeta["accent"] =
                draft.draft_type === "thread"
                  ? "violet"
                  : draft.draft_type === "reply"
                    ? "orange"
                    : "cyan";
              const tokens = ACCENT_TOKENS[draftAccent];

              return (
                <motion.div
                  key={draft.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "relative overflow-hidden border bg-void-black p-4",
                    isPublished ? "border-pulse-cyan/30" : "border-ghost-gray/30"
                  )}
                >
                  {/* left accent strip — mode color */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-0 h-full w-[2px]",
                      tokens.glow
                    )}
                  />

                  <div className="mb-3 flex flex-col items-start justify-between gap-3 pl-2 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.15em]",
                          tokens.border,
                          tokens.text
                        )}
                      >
                        {draft.draft_type}
                      </span>
                      {isReply && meta.target_author ? (
                        <span className="border border-signal-violet/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-signal-violet">
                          ↩ @{meta.target_author}
                        </span>
                      ) : null}
                      {isReply && meta.intent ? (
                        <span className="border border-ghost-gray/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-neural-white/55">
                          {meta.intent}
                        </span>
                      ) : null}
                      {isPublished ? (
                        <span className="border border-pulse-cyan/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-pulse-cyan">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="border border-ghost-gray/40 px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-neural-white/45">
                          DRAFT
                        </span>
                      )}
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-neural-white/30">
                        {draft.content.length}/280
                      </span>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      <button
                        type="button"
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35 transition-colors hover:text-neural-white/70"
                        onClick={() =>
                          navigator.clipboard.writeText(draft.content)
                        }
                      >
                        Copy
                      </button>
                      {isPublished ? null : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            magnetic={false}
                            onClick={() =>
                              setPreviewDraftId(
                                previewDraftId === draft.id ? null : draft.id
                              )
                            }
                            className="flex-1 sm:flex-none"
                          >
                            {previewDraftId === draft.id ? "Hide" : "Preview"}
                          </Button>
                          {isReply ? null : (
                            <Button
                              variant="secondary"
                              size="sm"
                              magnetic={false}
                              loading={publishingId === draft.id}
                              disabled={
                                Boolean(disabledReason) ||
                                publishingId === draft.id
                              }
                              onClick={() => handlePublish(draft)}
                              className="flex-1 sm:flex-none"
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            magnetic={false}
                            loading={postingToXId === draft.id}
                            disabled={
                              Boolean(disabledReason) ||
                              postingToXId === draft.id
                            }
                            onClick={() => handlePostToX(draft)}
                            className="flex-1 sm:flex-none"
                          >
                            {isReply ? "Send Reply" : "Post to X"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap pl-2 text-sm leading-relaxed text-neural-white/80">
                    {draft.content}
                  </p>

                  <AnimatePresence>
                    {previewDraftId === draft.id && !isPublished ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="ml-2 mt-3 overflow-hidden border border-pulse-cyan/30 bg-pulse-cyan/[0.04]"
                      >
                        <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-pulse-cyan">
                          {"// X PREVIEW · "}
                          {draft.content.length}
                          {"/280"}
                        </div>
                        <div className="border-t border-pulse-cyan/20 px-3 py-3">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neural-white">
                            {draft.content}
                          </p>
                          {draft.content.length > 280 ? (
                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-orange">
                              ⚠ over 280 — shorten or split into a thread
                            </p>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {isPublished && xHandle && !isReply ? (
                    <div className="ml-2 mt-3 border-t border-ghost-gray/15 pt-3">
                      <ClaimXPostForm
                        agentId={agentId}
                        draftId={draft.id}
                        alreadyClaimed={meta.claimed_credit ?? null}
                      />
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="relative overflow-hidden border border-dashed border-ghost-gray/30 px-4 py-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/40">
            {"// draft buffer empty"}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
            Pick a mode above and generate your first draft.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

interface TopicInputProps {
  topic: string;
  onTopicChange: (value: string) => void;
  disabled: boolean;
  loading: boolean;
  onGenerate: () => void;
  mode: Mode;
}

function TopicInput({
  topic,
  onTopicChange,
  disabled,
  loading,
  onGenerate,
  mode,
}: TopicInputProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <input
        value={topic}
        onChange={(event) => onTopicChange(event.target.value)}
        placeholder={
          mode === "thread"
            ? "// thread angle — what's the core idea?"
            : "// topic or angle"
        }
        disabled={disabled}
        className="border border-ghost-gray/40 bg-void-black px-4 py-3 font-mono text-sm text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/25 focus:border-pulse-cyan"
      />
      <Button
        variant="primary"
        size="md"
        magnetic={false}
        disabled={loading || topic.trim().length < 3 || disabled}
        onClick={onGenerate}
        className="w-full sm:w-auto"
      >
        {loading ? "Drafting..." : "Generate"}
      </Button>
    </div>
  );
}

interface ReplyInputProps {
  replyInput: string;
  onReplyInputChange: (value: string) => void;
  replyTweetId: string | null;
  replyAuthor: string;
  onReplyAuthorChange: (value: string) => void;
  replyTargetTweet: string;
  onReplyTargetTweetChange: (value: string) => void;
  replyIntent: ReplyIntent;
  onReplyIntentChange: (value: ReplyIntent) => void;
  replyNotes: string;
  onReplyNotesChange: (value: string) => void;
  disabled: boolean;
  loading: boolean;
  onGenerate: () => void;
}

function ReplyInput({
  replyInput,
  onReplyInputChange,
  replyTweetId,
  replyAuthor,
  onReplyAuthorChange,
  replyTargetTweet,
  onReplyTargetTweetChange,
  replyIntent,
  onReplyIntentChange,
  replyNotes,
  onReplyNotesChange,
  disabled,
  loading,
  onGenerate,
}: ReplyInputProps) {
  const targetReady = (replyTargetTweet || replyInput).trim().length >= 3;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
          <span>TARGET · paste tweet URL or text</span>
          {replyTweetId ? (
            <span className="border border-ember-orange/40 px-1.5 py-px text-[9px] tracking-[0.12em] text-ember-orange">
              REAL REPLY
            </span>
          ) : (replyInput || replyTargetTweet).trim().length > 0 ? (
            <span className="border border-ghost-gray/40 px-1.5 py-px text-[9px] tracking-[0.12em] text-neural-white/50">
              STANDALONE
            </span>
          ) : null}
        </label>
        <textarea
          value={replyInput}
          onChange={(event) => onReplyInputChange(event.target.value)}
          placeholder="https://x.com/handle/status/... or paste the tweet body"
          rows={3}
          disabled={disabled}
          className="w-full resize-y border border-ghost-gray/40 bg-void-black px-3 py-2.5 font-mono text-xs leading-relaxed text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20 focus:border-ember-orange"
        />
      </div>

      {/* parsed target packet — only shows when a URL was successfully parsed */}
      <AnimatePresence>
        {replyTweetId ? (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border border-ember-orange/40 bg-ember-orange/[0.04]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-ember-orange/20 bg-ember-orange/[0.06] px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-orange">
                <span className="mr-2 inline-block h-1.5 w-1.5 bg-ember-orange shadow-[0_0_8px_rgba(255,107,53,0.8)] align-middle" />
                TARGET ACQUIRED
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ember-orange/60">
                packet 0x{replyTweetId.slice(-6)}
              </span>
            </div>
            <dl className="grid gap-1.5 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em]">
              <div className="flex items-baseline gap-3">
                <dt className="w-20 text-neural-white/40">TWEET_ID</dt>
                <dd className="min-w-0 break-all text-neural-white/85">
                  {replyTweetId}
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-20 text-neural-white/40">AUTHOR</dt>
                <dd className="min-w-0 break-all text-neural-white/85">
                  {replyAuthor ? `@${replyAuthor}` : "(unknown)"}
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-20 text-neural-white/40">STATUS</dt>
                <dd className="text-ember-orange">in-thread reply armed</dd>
              </div>
            </dl>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* tweet body (only when URL parsed — otherwise input is the body) */}
      <AnimatePresence>
        {replyTweetId ? (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
              TWEET BODY · paste what the target actually said
            </label>
            <textarea
              value={replyTargetTweet}
              onChange={(event) => onReplyTargetTweetChange(event.target.value)}
              placeholder="// the tweet text we'll reason against"
              rows={3}
              disabled={disabled}
              className="w-full resize-y border border-ghost-gray/40 bg-void-black px-3 py-2.5 font-mono text-xs leading-relaxed text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20 focus:border-ember-orange"
            />
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
              {"// we don't hit X for the body — keeps credit cost down"}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
            AUTHOR HANDLE · optional
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center font-mono text-xs text-neural-white/35"
            >
              @
            </span>
            <input
              type="text"
              value={replyAuthor}
              onChange={(event) =>
                onReplyAuthorChange(event.target.value.replace(/^@/, ""))
              }
              placeholder="handle"
              disabled={disabled}
              className="w-full border border-ghost-gray/40 bg-void-black py-2.5 pl-6 pr-3 font-mono text-xs text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20 focus:border-ember-orange"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
            INTENT
          </label>
          <select
            value={replyIntent}
            onChange={(event) =>
              onReplyIntentChange(event.target.value as ReplyIntent)
            }
            disabled={disabled}
            className="w-full border border-ghost-gray/40 bg-void-black px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-neural-white/75 outline-none focus:border-ember-orange"
          >
            {REPLY_INTENTS.map((intent) => (
              <option key={intent.id} value={intent.id}>
                {intent.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-neural-white/45">
          EXTRA NOTES · optional ({replyNotes.length}/400)
        </label>
        <input
          type="text"
          value={replyNotes}
          onChange={(event) => onReplyNotesChange(event.target.value)}
          maxLength={400}
          placeholder='// e.g. "mention the L1 throughput angle"'
          disabled={disabled}
          className="w-full border border-ghost-gray/40 bg-void-black px-3 py-2.5 font-mono text-xs text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20 focus:border-ember-orange"
        />
      </div>

      <Button
        variant="primary"
        size="md"
        magnetic={false}
        disabled={loading || disabled || !targetReady}
        onClick={onGenerate}
        className="w-full sm:w-auto"
      >
        {loading ? "Drafting reply..." : "Draft Reply"}
      </Button>
    </div>
  );
}
