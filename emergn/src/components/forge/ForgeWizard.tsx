"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { SkillSelector } from "./SkillSelector";
import { AutonomySlider } from "./AutonomySlider";
import { ForgeSequence } from "./ForgeSequence";
import { ForgeReview } from "./ForgeReview";
import { forgeAgent, type ForgeInput } from "@/app/app/forge/actions";
import type { AgentArchetype } from "@/types";
import { fadeInUp } from "@/lib/animations";

type Step = "name" | "archetype" | "skills" | "autonomy" | "review" | "forging";

const STEPS: Step[] = ["name", "archetype", "skills", "autonomy", "review"];

export function ForgeWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<AgentArchetype | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [autonomyLevel, setAutonomyLevel] = useState(5);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step as Step);
  const canGoNext =
    (step === "name" && name.trim().length >= 2) ||
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

  const handleForge = async () => {
    if (!archetype) return;

    setStep("forging");
    setError(null);

    const input: ForgeInput = {
      name: name.trim(),
      archetype,
      skills,
      autonomyLevel,
    };

    const result = await forgeAgent(input);

    if (result.success && result.agentId) {
      setNewAgentId(result.agentId);
      // ForgeSequence will handle the redirect after animation
    } else {
      setError(result.error || "Forge failed");
      setStep("review");
    }
  };

  if (step === "forging") {
    return (
      <ForgeSequence
        agentName={name}
        archetype={archetype!}
        onComplete={() => {
          if (newAgentId) {
            router.push(`/app/agent/${newAgentId}`);
          } else {
            router.push("/app");
          }
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-0.5 flex-1 transition-colors duration-300 ${
              i <= stepIndex ? "bg-pulse-cyan" : "bg-ghost-gray/30"
            }`}
          />
        ))}
      </div>

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neural-white/30">
        Step {stepIndex + 1} of {STEPS.length}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="min-h-[300px]"
        >
          {step === "name" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
                Name Your Agent
              </h2>
              <p className="mb-6 font-mono text-xs text-neural-white/40">
                Choose a name that defines its identity in the network.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter agent name..."
                maxLength={30}
                className="w-full border border-ghost-gray/50 bg-ghost-gray/10 px-4 py-3 font-headline text-lg uppercase tracking-[0.1em] text-neural-white placeholder-neural-white/20 outline-none transition-colors focus:border-pulse-cyan"
                autoFocus
              />
              <p className="mt-2 font-mono text-[10px] text-neural-white/20">
                {name.length}/30 characters
              </p>
            </div>
          )}

          {step === "archetype" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
                Choose Archetype
              </h2>
              <p className="mb-6 font-mono text-xs text-neural-white/40">
                Select the core personality that drives your agent.
              </p>
              <ArchetypeSelector
                selected={archetype}
                onSelect={setArchetype}
              />
            </div>
          )}

          {step === "skills" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
                Assign Skills
              </h2>
              <p className="mb-6 font-mono text-xs text-neural-white/40">
                Select 2-4 skills for your agent to specialize in.
              </p>
              <SkillSelector selected={skills} onSelect={setSkills} />
            </div>
          )}

          {step === "autonomy" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
                Set Autonomy Level
              </h2>
              <p className="mb-6 font-mono text-xs text-neural-white/40">
                How much freedom does your agent have to decide on its own?
              </p>
              <AutonomySlider
                value={autonomyLevel}
                onChange={setAutonomyLevel}
              />
            </div>
          )}

          {step === "review" && (
            <div>
              <h2 className="mb-2 font-headline text-xl font-bold uppercase tracking-[0.1em] text-neural-white">
                Review & Forge
              </h2>
              <p className="mb-6 font-mono text-xs text-neural-white/40">
                Confirm your agent configuration before forging.
              </p>
              <ForgeReview
                name={name}
                archetype={archetype!}
                skills={skills}
                autonomyLevel={autonomyLevel}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="mt-4 border border-ember-orange/50 bg-ember-orange/10 p-3">
          <p className="font-mono text-xs text-ember-orange">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="md" onClick={goBack}>
            {"<"} Back
          </Button>
        ) : (
          <div />
        )}

        {step === "review" ? (
          <Button variant="primary" size="lg" onClick={handleForge}>
            Forge Agent
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!canGoNext}
          >
            Next {">"}
          </Button>
        )}
      </div>
    </div>
  );
}
