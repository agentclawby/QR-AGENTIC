"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface AgentPersonaProps {
  agent: Agent;
  isOwner: boolean;
  voiceImported: boolean;
}

interface PersonaState {
  backstory: string;
  beliefs: string;
  opinions: string;
  quirks: string;
  do_not_say: string;
  style_exemplars: string[];
}

type FieldKey = keyof Omit<PersonaState, "style_exemplars">;

interface FieldMeta {
  key: FieldKey;
  glyph: string;
  code: string;
  label: string;
  description: string;
  placeholder: string;
  accent: "cyan" | "violet" | "orange";
  limit: number;
  rows: number;
}

const FIELD_META: FieldMeta[] = [
  {
    key: "backstory",
    glyph: "◆",
    code: "ORIGIN.01",
    label: "Backstory",
    description:
      "Where you grew up, what shaped you, what jobs and obsessions made you who you are. The agent reaches for this only when context calls — never quoted verbatim.",
    placeholder:
      "Grew up in [...]. First learned to code when [...]. Was obsessed with [...]. Got into crypto because [...]",
    accent: "cyan",
    limit: 4000,
    rows: 7,
  },
  {
    key: "beliefs",
    glyph: "⬡",
    code: "CORE.02",
    label: "Beliefs and worldview",
    description:
      "What you believe is true about markets, technology, people, and the world. The agent uses these as a foundation when taking a position.",
    placeholder:
      "I believe attention is the only scarce asset in crypto. I believe most teams overcomplicate problems that need to be made simpler. I believe [...]",
    accent: "violet",
    limit: 2000,
    rows: 5,
  },
  {
    key: "opinions",
    glyph: "▲",
    code: "STANCE.03",
    label: "Specific opinions",
    description:
      "Strong takes on topics, projects, trends. One per paragraph. The agent draws on these only when the topic shows up.",
    placeholder:
      "SOL > ETH for the next cycle because [...]\nNarrative trading is mostly cope.\nL2s are a rounding error.",
    accent: "orange",
    limit: 4000,
    rows: 7,
  },
  {
    key: "quirks",
    glyph: "◈",
    code: "VOICE.04",
    label: "Quirks, humor, signature phrasing",
    description:
      "How you actually talk. Recurring jokes, callbacks, formatting habits, lowercase tics, words you'd never use, things that feel like 'you'.",
    placeholder:
      "I always end big calls with 'we'll see'. I use lowercase for emphasis sometimes. I'll riff on the word 'cope' when something looks like denial.",
    accent: "cyan",
    limit: 1500,
    rows: 5,
  },
  {
    key: "do_not_say",
    glyph: "⊘",
    code: "GUARD.05",
    label: "Things to never say",
    description:
      "Phrases, takes, or topics the agent must avoid. Treated as a hard fence — the single most important field for staying on-brand.",
    placeholder:
      "Don't use 'leverage' as a verb.\nDon't make predictions with exact prices.\nNever endorse pumpfun launches by name.",
    accent: "orange",
    limit: 1500,
    rows: 5,
  },
];

const ACCENT_TOKENS: Record<
  FieldMeta["accent"],
  {
    border: string;
    bg: string;
    glow: string;
    text: string;
    focus: string;
    shadow: string;
    hairline: string;
  }
> = {
  cyan: {
    border: "border-pulse-cyan/30",
    bg: "bg-pulse-cyan/[0.03]",
    glow: "bg-pulse-cyan",
    text: "text-pulse-cyan",
    focus: "focus:border-pulse-cyan",
    shadow: "shadow-[0_0_8px_rgba(0,240,255,0.6)]",
    hairline:
      "bg-gradient-to-r from-transparent via-pulse-cyan/70 to-transparent",
  },
  violet: {
    border: "border-signal-violet/30",
    bg: "bg-signal-violet/[0.04]",
    glow: "bg-signal-violet",
    text: "text-signal-violet",
    focus: "focus:border-signal-violet",
    shadow: "shadow-[0_0_8px_rgba(139,92,246,0.6)]",
    hairline:
      "bg-gradient-to-r from-transparent via-signal-violet/70 to-transparent",
  },
  orange: {
    border: "border-ember-orange/30",
    bg: "bg-ember-orange/[0.04]",
    glow: "bg-ember-orange",
    text: "text-ember-orange",
    focus: "focus:border-ember-orange",
    shadow: "shadow-[0_0_8px_rgba(255,107,53,0.6)]",
    hairline:
      "bg-gradient-to-r from-transparent via-ember-orange/70 to-transparent",
  },
};

function isDirty(current: PersonaState, original: PersonaState) {
  if (
    current.backstory !== original.backstory ||
    current.beliefs !== original.beliefs ||
    current.opinions !== original.opinions ||
    current.quirks !== original.quirks ||
    current.do_not_say !== original.do_not_say
  ) {
    return true;
  }
  if (current.style_exemplars.length !== original.style_exemplars.length) {
    return true;
  }
  return current.style_exemplars.some(
    (value, index) => value !== original.style_exemplars[index]
  );
}

export function AgentPersona({
  agent,
  isOwner,
  voiceImported,
}: AgentPersonaProps) {
  const router = useRouter();

  const original = useMemo<PersonaState>(
    () => ({
      backstory: agent.backstory ?? "",
      beliefs: agent.beliefs ?? "",
      opinions: agent.opinions ?? "",
      quirks: agent.quirks ?? "",
      do_not_say: agent.do_not_say ?? "",
      style_exemplars: Array.isArray(agent.style_exemplars)
        ? agent.style_exemplars
        : [],
    }),
    [agent]
  );

  const [state, setState] = useState<PersonaState>(original);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exemplarDraft, setExemplarDraft] = useState("");

  // Read-only summary for non-owners — the public agent page can surface a
  // sanitized version later. For now: a single panel listing which fields
  // have been authored, no content leakage.
  if (!isOwner) {
    const filled: string[] = [];
    if (agent.backstory?.trim()) filled.push("backstory");
    if (agent.beliefs?.trim()) filled.push("beliefs");
    if (agent.opinions?.trim()) filled.push("opinions");
    if (agent.quirks?.trim()) filled.push("quirks");
    if (agent.do_not_say?.trim()) filled.push("guard rails");
    if ((agent.style_exemplars ?? []).length > 0) filled.push("voice anchors");

    return (
      <div className="relative overflow-hidden border border-ghost-gray/30 bg-ghost-gray/5 px-4 py-12 text-center">
        <span aria-hidden className="hairline absolute inset-x-0 top-0" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pulse-cyan/60">
          {"// PERSONA :: read-only"}
        </p>
        <p className="mt-3 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white">
          {filled.length === 0
            ? "Persona layer not yet authored."
            : `Owner has authored ${filled.length} of 6 persona signals.`}
        </p>
        {filled.length > 0 ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/45">
            {filled.join(" · ")}
          </p>
        ) : null}
      </div>
    );
  }

  const dirty = isDirty(state, original);

  const filledFields = FIELD_META.filter((f) => state[f.key].trim().length > 0)
    .length;
  const anchorsAuthored = state.style_exemplars.length > 0 ? 1 : 0;
  const completion = Math.round(
    ((filledFields + anchorsAuthored) / (FIELD_META.length + 1)) * 100
  );

  const updateField = (key: FieldKey, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
    setError(null);
  };

  const addExemplar = () => {
    const trimmed = exemplarDraft.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      setError("Each exemplar must be 500 characters or fewer.");
      return;
    }
    if (state.style_exemplars.length >= 10) {
      setError("Maximum of 10 style exemplars.");
      return;
    }
    setState((prev) => ({
      ...prev,
      style_exemplars: [...prev.style_exemplars, trimmed],
    }));
    setExemplarDraft("");
    setError(null);
    setStatus(null);
  };

  const removeExemplar = (index: number) => {
    setState((prev) => ({
      ...prev,
      style_exemplars: prev.style_exemplars.filter((_, i) => i !== index),
    }));
    setStatus(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backstory: state.backstory,
          beliefs: state.beliefs,
          opinions: state.opinions,
          quirks: state.quirks,
          do_not_say: state.do_not_say,
          style_exemplars: state.style_exemplars,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Persona save failed");
      }
      setStatus("Persona committed. Every generation now reads from this layer.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Persona save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setState(original);
    setStatus(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER STATUS PANEL ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden border border-ghost-gray/30 bg-ghost-gray/5 p-5 sm:p-6"
      >
        <span aria-hidden className="hairline absolute inset-x-0 top-0" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pulse-cyan/80">
              <span className="status-dot mr-2 align-middle" />
              {"// PERSONA_LAYER :: ENRICHMENT"}
            </p>
            <h2 className="mt-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:text-2xl sm:tracking-[0.1em]">
              Memory Injection<span className="text-pulse-cyan caret">.</span>
            </h2>
            <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-neural-white/55">
              These six signals layer on top of the agent&apos;s base voice and
              any X-derived overlay. Every content draft, reply, and
              consultation reads from this block in real time. Nothing here is
              quoted verbatim — the agent absorbs the cadence and stance.
            </p>
          </div>

          <div className="flex flex-shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div
              className={cn(
                "inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em]",
                voiceImported
                  ? "border-pulse-cyan/40 bg-pulse-cyan/[0.06] text-pulse-cyan"
                  : "border-ghost-gray/40 text-neural-white/45"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5",
                  voiceImported ? "bg-pulse-cyan shadow-[0_0_8px_rgba(0,240,255,0.7)]" : "bg-ghost-gray"
                )}
              />
              X VOICE {voiceImported ? "ACTIVE" : "OFFLINE"}
            </div>
            {agent.persona_updated_at ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/35">
                LAST WRITE · {new Date(agent.persona_updated_at).toLocaleString()}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neural-white/30">
                NEVER WRITTEN
              </span>
            )}
          </div>
        </div>

        {/* completion meter */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.15em]">
            <span className="text-neural-white/45">SATURATION</span>
            <span className="text-pulse-cyan">
              {filledFields + anchorsAuthored} / {FIELD_META.length + 1}
              <span className="ml-2 text-neural-white/30">·</span>
              <span className="ml-2">{completion}%</span>
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden border border-ghost-gray/40 bg-void-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-pulse-cyan via-signal-violet to-ember-orange shadow-[0_0_18px_rgba(0,240,255,0.4)]"
            />
          </div>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-neural-white/35">
            Saturation is a heuristic — 100% means each signal has been
            authored. Voice fidelity improves disproportionately past 60%.
          </p>
        </div>
      </motion.div>

      {/* ─── FIELD CARDS ─────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {FIELD_META.map((field, fieldIndex) => {
          const tokens = ACCENT_TOKENS[field.accent];
          const value = state[field.key];
          const fillPct = Math.min(100, (value.length / field.limit) * 100);
          const overflow = value.length > field.limit;
          const authored = value.trim().length > 0;
          const isWide = field.key === "backstory" || field.key === "opinions";

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: fieldIndex * 0.05,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "relative overflow-hidden border bg-ghost-gray/5 p-5 transition-colors sm:p-6",
                isWide ? "lg:col-span-2" : "",
                authored
                  ? `${tokens.border} ${tokens.bg}`
                  : "border-ghost-gray/30"
              )}
            >
              {/* hairline accent — colored per field */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 h-px",
                  tokens.hairline
                )}
              />

              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center border font-mono text-sm",
                      authored
                        ? `${tokens.border} ${tokens.text} ${tokens.shadow}`
                        : "border-ghost-gray/40 text-neural-white/40"
                    )}
                  >
                    {field.glyph}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.18em]",
                        authored ? tokens.text : "text-neural-white/40"
                      )}
                    >
                      {field.code}
                    </p>
                    <h3 className="mt-1 font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.12em]">
                      {field.label}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-right">
                  <span
                    className={cn(
                      "border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.15em]",
                      overflow
                        ? "border-ember-orange/50 text-ember-orange"
                        : authored
                          ? "border-pulse-cyan/40 text-pulse-cyan"
                          : "border-ghost-gray/40 text-neural-white/40"
                    )}
                  >
                    {overflow ? "OVER" : authored ? "AUTHORED" : "EMPTY"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-[0.12em]",
                      overflow ? "text-ember-orange" : "text-neural-white/40"
                    )}
                  >
                    {value.length} / {field.limit}
                  </span>
                </div>
              </div>

              <p className="mb-3 font-mono text-[11px] leading-relaxed text-neural-white/55">
                {field.description}
              </p>

              <div className="relative">
                <textarea
                  value={value}
                  onChange={(event) =>
                    updateField(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  rows={field.rows}
                  className={cn(
                    "w-full resize-y border bg-void-black px-3 py-3 font-mono text-xs leading-relaxed text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20",
                    "border-ghost-gray/40",
                    tokens.focus,
                    "focus:bg-void-black"
                  )}
                />
                {/* fill bar at the textarea base */}
                <div className="relative h-0.5 w-full overflow-hidden bg-ghost-gray/30">
                  <motion.div
                    animate={{ width: `${overflow ? 100 : fillPct}%` }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "h-full",
                      overflow ? "bg-ember-orange" : tokens.glow
                    )}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── VOICE ANCHORS (style_exemplars) ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: FIELD_META.length * 0.05,
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative overflow-hidden border border-pulse-cyan/30 bg-pulse-cyan/[0.03] p-5 sm:p-6"
      >
        <span aria-hidden className="hairline absolute inset-x-0 top-0" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center border border-pulse-cyan/40 font-mono text-sm text-pulse-cyan shadow-[0_0_8px_rgba(0,240,255,0.55)]"
            >
              ⟐
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pulse-cyan">
                ANCHORS.06
              </p>
              <h3 className="mt-1 font-headline text-sm font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.12em]">
                Voice Anchors
              </h3>
            </div>
          </div>

          <span
            className={cn(
              "border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.15em]",
              state.style_exemplars.length > 0
                ? "border-pulse-cyan/40 text-pulse-cyan"
                : "border-ghost-gray/40 text-neural-white/40"
            )}
          >
            {state.style_exemplars.length} / 10
          </span>
        </div>

        <p className="mb-4 font-mono text-[11px] leading-relaxed text-neural-white/55">
          Paste 3-10 short lines that sound exactly like you. The agent studies
          cadence, stance, and word choice — never repeats verbatim. This is
          the single biggest lever for voice fidelity in V1.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={exemplarDraft}
            onChange={(event) => setExemplarDraft(event.target.value)}
            placeholder="// drop a line that sounds like you"
            rows={2}
            className="min-w-0 flex-1 resize-y border border-ghost-gray/40 bg-void-black px-3 py-2 font-mono text-xs leading-relaxed text-neural-white/85 outline-none transition-colors placeholder:text-neural-white/20 focus:border-pulse-cyan"
          />
          <Button
            variant="secondary"
            size="sm"
            magnetic={false}
            onClick={addExemplar}
            disabled={
              !exemplarDraft.trim() || state.style_exemplars.length >= 10
            }
            className="w-full sm:w-auto"
          >
            + Anchor
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {state.style_exemplars.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-1.5"
            >
              {state.style_exemplars.map((line, index) => (
                <motion.li
                  key={`${index}-${line.slice(0, 16)}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex items-start gap-3 border border-ghost-gray/30 bg-void-black/70 px-3 py-2.5 transition-colors hover:border-pulse-cyan/40"
                >
                  <span className="select-none pt-px font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan/60">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="select-none pt-px font-mono text-[10px] text-neural-white/30">
                    →
                  </span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neural-white/85">
                    {line}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExemplar(index)}
                    aria-label={`Remove exemplar ${index + 1}`}
                    className="shrink-0 self-start font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30 transition-colors hover:text-ember-orange"
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30"
            >
              {"// no anchors yet — even three concrete lines move the needle"}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── COMMIT BAR ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "sticky bottom-3 z-20 flex flex-col items-stretch justify-between gap-3 border bg-void-black/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:p-4",
          dirty
            ? "border-pulse-cyan/40 shadow-[0_0_36px_rgba(0,240,255,0.18),inset_0_1px_0_rgba(0,240,255,0.18)]"
            : "border-ghost-gray/40"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity",
            dirty ? "opacity-100" : "opacity-0",
            "bg-gradient-to-r from-transparent via-pulse-cyan to-transparent"
          )}
        />

        <div className="flex min-w-0 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span
            className={cn(
              "h-1.5 w-1.5",
              dirty
                ? "bg-pulse-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                : status
                  ? "bg-pulse-cyan/70"
                  : "bg-ghost-gray"
            )}
          />
          {error ? (
            <span className="truncate text-ember-orange">ERROR · {error}</span>
          ) : status ? (
            <span className="truncate text-pulse-cyan">{status}</span>
          ) : dirty ? (
            <span className="text-neural-white/70">
              UNCOMMITTED · {filledFields} of {FIELD_META.length} fields authored
            </span>
          ) : (
            <span className="text-neural-white/35">
              IDLE · awaiting input
            </span>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            onClick={handleRevert}
            disabled={!dirty || saving}
            className="w-full sm:w-auto"
          >
            Revert
          </Button>
          <Button
            variant="primary"
            size="sm"
            magnetic={false}
            onClick={handleSave}
            loading={saving}
            disabled={!dirty || saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Committing..." : "Commit Persona"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
