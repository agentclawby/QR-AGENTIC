"use client";

import { SKILLS } from "@/lib/agent-constants";
import { cn } from "@/lib/utils";

interface SkillSelectorProps {
  selected: string[];
  onSelect: (skills: string[]) => void;
}

export function SkillSelector({ selected, onSelect }: SkillSelectorProps) {
  const toggleSkill = (skillId: string) => {
    if (selected.includes(skillId)) {
      onSelect(selected.filter((s) => s !== skillId));
    } else if (selected.length < 4) {
      onSelect([...selected, skillId]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((skill) => {
          const isSelected = selected.includes(skill.id);

          return (
            <button
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
              className={cn(
                "cursor-pointer border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-all duration-200 sm:tracking-[0.1em]",
                isSelected
                  ? "border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                  : "border-ghost-gray/30 text-neural-white/40 hover:border-ghost-gray/60 hover:text-neural-white/60"
              )}
            >
              {skill.name}
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] text-neural-white/20">
        {selected.length}/4 skills selected (min 2)
      </p>
    </div>
  );
}
