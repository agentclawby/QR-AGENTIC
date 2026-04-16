"use client";

import { ARCHETYPES, SKILLS } from "@/lib/agent-constants";
import type { AgentArchetype, ExtractedPersonalityTraits } from "@/types";

interface ForgeReviewProps {
  name: string;
  archetype: AgentArchetype;
  skills: string[];
  autonomyLevel: number;
  personalitySource: "archetype" | "x_import" | "hybrid";
  xTraits: ExtractedPersonalityTraits | null;
}

export function ForgeReview({
  name,
  archetype,
  skills,
  autonomyLevel,
  personalitySource,
  xTraits,
}: ForgeReviewProps) {
  const archetypeData = ARCHETYPES.find((a) => a.name === archetype);
  const skillNames = skills.map(
    (id) => SKILLS.find((s) => s.id === id)?.name ?? id
  );

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
          Agent Name
        </span>
        <p className="mt-1 font-headline text-lg font-bold uppercase tracking-[0.1em] text-neural-white">
          {name}
        </p>
      </div>

      {/* Archetype */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
          Archetype
        </span>
        <div className="mt-1 flex items-center gap-2">
          <div
            className="h-2.5 w-2.5"
            style={{ backgroundColor: archetypeData?.color }}
          />
          <p
            className="font-headline text-sm font-bold uppercase tracking-[0.15em]"
            style={{ color: archetypeData?.color }}
          >
            {archetype}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
          Skills
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {skillNames.map((skill) => (
            <span
              key={skill}
              className="border border-pulse-cyan/30 bg-pulse-cyan/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-pulse-cyan"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Autonomy */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
          Autonomy Level
        </span>
        <p className="mt-1 font-mono text-lg font-bold text-pulse-cyan">
          {autonomyLevel}
          <span className="text-xs text-neural-white/30">/10</span>
        </p>
      </div>

      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neural-white/30">
          Personality Source
        </span>
        <p className="mt-1 font-mono text-sm uppercase tracking-[0.12em] text-neural-white/65">
          {personalitySource === "archetype"
            ? "Archetype only"
            : personalitySource === "x_import"
              ? "Imported X voice"
              : "Hybrid"}
        </p>
        {xTraits ? (
          <p className="mt-2 text-sm leading-relaxed text-neural-white/55">
            Tone: {xTraits.tone.join(", ")}. Topics: {xTraits.topicClusters.slice(0, 4).join(", ")}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
