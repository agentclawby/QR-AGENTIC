"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { Button } from "@/components/ui/Button";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { SkillSelector } from "./SkillSelector";
import { AutonomySlider } from "./AutonomySlider";
import { ForgeSequence } from "./ForgeSequence";
import { ForgeReview } from "./ForgeReview";
import { XPersonalityImport } from "./XPersonalityImport";
import { forgeAgent, type ForgeInput } from "@/app/app/forge/actions";
import { getAgentNameSuggestions } from "@/app/app/forge/name-suggestions";
import type { NameSuggestion } from "@/lib/ai/agent-naming";
import { buildSolanaAuthMessage } from "@/lib/auth/solana-auth";
import type {
  AgentArchetype,
  CapabilityStatus,
  ExtractedPersonalityTraits,
} from "@/types";
import { depthIn, shake } from "@/lib/animations";

type Step =
  | "name"
  | "personality"
  | "archetype"
  | "skills"
  | "autonomy"
  | "review"
  | "forging"
  | "passport";

type PassportStatus =
  | "idle"
  | "signing"
  | "submitting"
  | "issued"
  | "skipped"
  | "failed";

const STEPS: Step[] = [
  "name",
  "personality",
  "archetype",
  "skills",
  "autonomy",
  "review",
];

const STEP_LABELS: Partial<Record<Step, string>> = {
  name: "Identity",
  personality: "Voice",
  archetype: "Type",
  skills: "Skills",
  autonomy: "Control",
  review: "Review",
};

interface ForgeWizardProps {
  userId: string;
  xHandle: string | null;
  walletAddress: string | null;
  xImportCapability: CapabilityStatus;
  passportCapability: CapabilityStatus;
}

export function ForgeWizard({
  userId,
  xHandle,
  walletAddress,
  xImportCapability,
  passportCapability,
}: ForgeWizardProps) {
  const router = useRouter();
  const { publicKey, signMessage, connected } = useWallet();
  const [step, setStep] = useState<Step>("name");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<AgentArchetype | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [autonomyLevel, setAutonomyLevel] = useState(5);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const [importXPersonality, setImportXPersonality] = useState(false);
  const [personalityOverlay, setPersonalityOverlay] = useState("");
  const [xTraits, setXTraits] = useState<ExtractedPersonalityTraits | null>(null);
  const [passportStatus, setPassportStatus] = useState<PassportStatus>("idle");
  const [passportMessage, setPassportMessage] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsSource, setSuggestionsSource] = useState<
    "cache" | "fresh" | "fallback" | null
  >(null);

  // Autosave: persist the wizard form across refresh / accidental close.
  // Scoped per-user so two browser tabs from different accounts on the same
  // machine don't bleed. Cleared once the agent is forged successfully.
  const AUTOSAVE_KEY = `emergn.forge.draft.${userId}`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        name?: string;
        archetype?: AgentArchetype | null;
        skills?: string[];
        autonomyLevel?: number;
        importXPersonality?: boolean;
        personalityOverlay?: string;
        step?: Step;
      };
      if (typeof draft.name === "string") setName(draft.name);
      if (draft.archetype) setArchetype(draft.archetype);
      if (Array.isArray(draft.skills)) setSkills(draft.skills);
      if (typeof draft.autonomyLevel === "number") setAutonomyLevel(draft.autonomyLevel);
      if (typeof draft.importXPersonality === "boolean") setImportXPersonality(draft.importXPersonality);
      if (typeof draft.personalityOverlay === "string") setPersonalityOverlay(draft.personalityOverlay);
      if (draft.step && STEPS.includes(draft.step)) setStep(draft.step);
    } catch {
      // ignore — corrupt draft is the same as no draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step === "forging" || step === "passport") return;
    try {
      window.sessionStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
          name,
          archetype,
          skills,
          autonomyLevel,
          importXPersonality,
          personalityOverlay,
          step,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    AUTOSAVE_KEY,
    name,
    archetype,
    skills,
    autonomyLevel,
    importXPersonality,
    personalityOverlay,
    step,
  ]);

  // Fetch AI-suggested names on mount when the user has X linked. Suggestions
  // are server-cached on x_personality_cache, so this is cheap on revisits.
  useEffect(() => {
    if (!xHandle) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    getAgentNameSuggestions()
      .then((res) => {
        if (cancelled) return;
        setNameSuggestions(res.suggestions);
        setSuggestionsSource(res.source);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [xHandle]);

  const stepIndex = STEPS.indexOf(step as Step);
  const canGoNext =
    (step === "name" && name.trim().length >= 2) ||
    (step === "personality" &&
      (!importXPersonality || personalityOverlay.trim().length > 0)) ||
    (step === "archetype" && archetype !== null) ||
    (step === "skills" && skills.length >= 2 && skills.length <= 4) ||
    step === "autonomy" ||
    step === "review";

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      setStep(STEPS[idx - 1]);
    }
  };

  const passportEligible =
    passportCapability.enabled &&
    Boolean(walletAddress) &&
    connected &&
    Boolean(publicKey) &&
    Boolean(signMessage) &&
    publicKey?.toBase58() === walletAddress;

  const handleCreate = async () => {
    if (!archetype || creating) return;

    setCreating(true);
    setError(null);

    const input: ForgeInput = {
      name: name.trim(),
      archetype,
      skills,
      autonomyLevel,
      personalitySource: importXPersonality ? "hybrid" : "archetype",
      personalityOverlay: importXPersonality ? personalityOverlay : "",
    };

    try {
      const result = await forgeAgent(input);

      if (result.success && result.agentId) {
        setNewAgentId(result.agentId);
        // Forge succeeded — clear the autosave so the next visit starts fresh.
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem(AUTOSAVE_KEY);
          } catch {
            // ignore
          }
        }
        setStep("forging");
      } else {
        setError(result.error || "Creation failed");
        setStep("review");
      }
    } finally {
      setCreating(false);
    }
  };

  const issuePassport = async (agentId: string) => {
    if (!publicKey || !signMessage || !walletAddress) {
      setPassportStatus("skipped");
      return;
    }
    try {
      setPassportStatus("signing");
      setPassportMessage("Sign in your wallet to issue the Agent Passport.");

      const nonceResponse = await fetch("/api/auth/siws/nonce", {
        cache: "no-store",
      });
      if (!nonceResponse.ok) throw new Error("Failed to request nonce");
      const { nonce } = await nonceResponse.json();

      const message = new TextEncoder().encode(
        buildSolanaAuthMessage({
          intent: "issue-passport",
          publicKey: publicKey.toBase58(),
          nonce,
          origin: window.location.origin,
          userId,
          agentId,
        })
      );

      const signature = await signMessage(message);

      setPassportStatus("submitting");
      setPassportMessage("Issuing passport on chain...");

      const response = await fetch(`/api/agents/${agentId}/passport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message: bs58.encode(message),
          nonce,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to issue passport");
      }
      setPassportStatus("issued");
      setPassportMessage(`Passport ${data.passport?.passport_uid ?? ""} issued.`);
    } catch (err) {
      setPassportStatus("failed");
      setPassportMessage(
        err instanceof Error ? err.message : "Passport signing failed"
      );
    }
  };

  // After ForgeSequence animation completes, either kick off passport signing
  // (if a wallet is linked + connected) or redirect immediately.
  useEffect(() => {
    if (step !== "passport" || !newAgentId) return;
    if (passportStatus === "idle" && passportEligible) {
      void issuePassport(newAgentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, newAgentId, passportStatus, passportEligible]);

  if (step === "forging") {
    return (
      <ForgeSequence
        agentName={name}
        archetype={archetype!}
        onComplete={() => {
          if (!newAgentId) {
            router.push("/app");
            return;
          }
          if (passportEligible) {
            setStep("passport");
          } else {
            router.push(`/app/agent/${newAgentId}`);
          }
        }}
      />
    );
  }

  if (step === "passport") {
    const done =
      passportStatus === "issued" ||
      passportStatus === "skipped" ||
      passportStatus === "failed";
    return (
      <div className="mx-auto max-w-xl border border-ghost-gray/30 bg-void-black p-5 sm:p-8">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-pulse-cyan sm:tracking-[0.2em]">
          <span className="status-dot mr-2 align-middle" />
          Agent Passport
        </p>
        <h2 className="mb-4 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
          {passportStatus === "issued"
            ? "Passport Issued"
            : passportStatus === "failed"
              ? "Passport Signing Failed"
              : passportStatus === "skipped"
                ? "Passport Skipped"
                : "Sign Passport"}
        </h2>
        <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/60">
          {passportMessage ??
            "Approve the wallet signature to bind this agent to your wallet on chain."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {!done && (
            <Button variant="ghost" size="sm" onClick={() => router.push(`/app/agent/${newAgentId}`)}>
              Skip for now
            </Button>
          )}
          {passportStatus === "failed" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPassportStatus("idle");
                setPassportMessage(null);
              }}
            >
              Retry
            </Button>
          )}
          {done && (
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/app/agent/${newAgentId}`)}
            >
              Continue to Agent
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress — segmented with active glow */}
      <div className="mb-3 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="relative h-0.5 flex-1 overflow-hidden bg-ghost-gray/30">
            <motion.div
              initial={false}
              animate={{
                scaleX: i < stepIndex ? 1 : i === stepIndex ? 0.65 : 0,
                backgroundColor: i <= stepIndex ? "#00F0FF" : "rgba(42,42,53,0.3)",
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "left", boxShadow: i === stepIndex ? "0 0 12px rgba(0,240,255,0.6)" : undefined }}
              className="absolute inset-0"
            />
          </div>
        ))}
      </div>

      <motion.div
        key={`step-label-${step}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em]"
      >
        <span className="text-pulse-cyan">
          <span className="status-dot mr-2 align-middle" />
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <span className="truncate text-neural-white/40">
          {STEP_LABELS[step] ?? step}
        </span>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={depthIn}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -16, filter: "blur(8px)", transition: { duration: 0.25 } }}
          className="min-h-[300px]"
        >
          {step === "name" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Name Your Agent
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Pick the identity your workspace and network will recognize.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ORACLE, HUNTER, SPECTRA…"
                  maxLength={30}
                  className="peer w-full border border-ghost-gray/50 bg-ghost-gray/10 px-4 py-3 font-headline text-base uppercase tracking-[0.08em] text-neural-white placeholder-neural-white/20 outline-none transition-colors focus:border-pulse-cyan focus:bg-pulse-cyan/5 focus:shadow-[0_0_24px_rgba(0,240,255,0.15),inset_0_1px_0_rgba(0,240,255,0.12)] sm:text-lg sm:tracking-[0.1em]"
                  autoFocus
                />
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-pulse-cyan via-signal-violet to-pulse-cyan"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: name.length >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-neural-white/40">
                <span className={name.length >= 2 ? "text-pulse-cyan" : ""}>{name.length}</span>/30 characters
                {name.length >= 2 && <span className="ml-3 text-pulse-cyan">✓ valid identifier</span>}
              </p>

              {(suggestionsLoading || nameSuggestions.length > 0) && (
                <div className="mt-6 border border-ghost-gray/30 bg-ghost-gray/5 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span className="text-pulse-cyan">
                      <span className="status-dot mr-2 align-middle" />
                      Suggested by your X voice
                    </span>
                    {suggestionsSource && !suggestionsLoading && (
                      <span
                        className={
                          suggestionsSource === "fallback"
                            ? "border border-ember-orange/40 bg-ember-orange/5 px-2 py-0.5 text-ember-orange"
                            : "border border-pulse-cyan/30 bg-pulse-cyan/5 px-2 py-0.5 text-pulse-cyan/80"
                        }
                        title={
                          suggestionsSource === "cache"
                            ? "Loaded from your saved X voice cache."
                            : suggestionsSource === "fresh"
                              ? "Generated just now from your X voice."
                              : "X voice not yet imported — generic suggestions."
                        }
                      >
                        {suggestionsSource === "cache"
                          ? "// from your X voice"
                          : suggestionsSource === "fresh"
                            ? "// fresh from your X voice"
                            : "// fallback — import X for personalised names"}
                      </span>
                    )}
                  </div>
                  {suggestionsLoading && (
                    <p className="font-mono text-xs text-neural-white/40">
                      Reading your signal…
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {nameSuggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setName(s.name)}
                        title={s.rationale}
                        className="group border border-pulse-cyan/30 bg-pulse-cyan/5 px-3 py-1.5 font-headline text-sm font-bold uppercase tracking-[0.1em] text-neural-white transition-all hover:border-pulse-cyan hover:bg-pulse-cyan/15 hover:shadow-[0_0_18px_rgba(0,240,255,0.35)]"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {nameSuggestions.length > 0 && (
                    <p className="mt-3 font-mono text-[10px] leading-relaxed text-neural-white/40">
                      Hover a chip for the rationale, or type your own above.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "archetype" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Choose Agent Type
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Select the operating style that shapes your agent.
              </p>
              <ArchetypeSelector
                selected={archetype}
                onSelect={setArchetype}
              />
            </div>
          )}

          {step === "skills" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Choose Skills
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Select 2-4 skills for your agent to specialize in.
              </p>
              <SkillSelector selected={skills} onSelect={setSkills} />
            </div>
          )}

          {step === "autonomy" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Set Control Level
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Decide how much initiative the agent can take before asking you.
              </p>
              <AutonomySlider
                value={autonomyLevel}
                onChange={setAutonomyLevel}
              />
            </div>
          )}

          {step === "personality" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Add Voice
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Keep the core type, then optionally add a voice overlay from X.
              </p>
              <XPersonalityImport
                xHandle={xHandle}
                capability={xImportCapability}
                enabled={importXPersonality}
                onEnabledChange={(enabled) => {
                  setImportXPersonality(enabled);
                  if (!enabled) {
                    setPersonalityOverlay("");
                    setXTraits(null);
                  }
                }}
                onImported={(payload) => {
                  setPersonalityOverlay(payload.overlay);
                  setXTraits(payload.traits);
                }}
              />
            </div>
          )}

          {step === "review" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em]">
                Review & Create
              </h2>
              <p className="mb-6 font-mono text-xs leading-relaxed text-neural-white/40">
                Confirm your agent configuration before creating.
              </p>
              <ForgeReview
                name={name}
                archetype={archetype!}
                skills={skills}
                autonomyLevel={autonomyLevel}
                personalitySource={importXPersonality ? "hybrid" : "archetype"}
                xTraits={xTraits}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            variants={shake}
            initial="rest"
            animate="shake"
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 border border-ember-orange/60 bg-ember-orange/10 p-3 shadow-[0_0_20px_rgba(255,107,53,0.25)]"
          >
            <p className="font-mono text-xs text-ember-orange">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="md" onClick={goBack} className="flex-1 sm:flex-none">
            {"<"} Back
          </Button>
        ) : (
          <div />
        )}

        {step === "review" ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreate}
            loading={creating}
            disabled={creating}
            className="flex-1 sm:flex-none"
          >
            {creating ? "Creating..." : "Create Agent"}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!canGoNext}
            className="flex-1 sm:flex-none"
          >
            Next {">"}
          </Button>
        )}
      </div>
    </div>
  );
}
