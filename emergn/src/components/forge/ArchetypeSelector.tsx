"use client";

import { motion } from "framer-motion";
import { ARCHETYPES } from "@/lib/agent-constants";
import { cn } from "@/lib/utils";
import type { AgentArchetype } from "@/types";

interface ArchetypeSelectorProps {
  selected: AgentArchetype | null;
  onSelect: (archetype: AgentArchetype) => void;
}

export function ArchetypeSelector({
  selected,
  onSelect,
}: ArchetypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ARCHETYPES.map((archetype) => {
        const isSelected = selected === archetype.name;

        return (
          <motion.button
            key={archetype.id}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(archetype.name)}
            className={cn(
              "cursor-pointer border p-4 text-left transition-all duration-200",
              isSelected
                ? "bg-opacity-10"
                : "border-ghost-gray/30 bg-ghost-gray/5 hover:border-ghost-gray/60"
            )}
            style={
              isSelected
                ? {
                    borderColor: archetype.color,
                    backgroundColor: `${archetype.color}10`,
                    boxShadow: `0 0 20px ${archetype.color}15`,
                  }
                : undefined
            }
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-2.5 w-2.5"
                style={{ backgroundColor: archetype.color }}
              />
              <span
                className="font-headline text-sm font-bold uppercase tracking-[0.15em]"
                style={{ color: isSelected ? archetype.color : undefined }}
              >
                {archetype.name}
              </span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-neural-white/50">
              {archetype.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
