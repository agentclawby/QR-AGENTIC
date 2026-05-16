"use client";

import { motion } from "framer-motion";
import { ARCHETYPES } from "@/lib/agent-constants";
import { staggerFast, depthIn } from "@/lib/animations";
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
    <motion.div
      variants={staggerFast}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:grid-cols-2"
    >
      {ARCHETYPES.map((archetype) => {
        const isSelected = selected === archetype.name;

        return (
          <motion.button
            key={archetype.id}
            variants={depthIn}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(archetype.name)}
            className={cn(
              "group relative cursor-pointer overflow-hidden border p-4 text-left transition-colors duration-300",
              isSelected
                ? ""
                : "border-ghost-gray/40 bg-ghost-gray/5 hover:border-ghost-gray hover:bg-ghost-gray/10"
            )}
            style={
              isSelected
                ? {
                    borderColor: archetype.color,
                    backgroundColor: `${archetype.color}14`,
                    boxShadow: `0 0 36px ${archetype.color}33, inset 0 1px 0 ${archetype.color}33`,
                  }
                : undefined
            }
          >
            {/* hover sweeping highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-all duration-700 group-hover:left-full"
            />
            {/* selected pulse ring */}
            {isSelected && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 border"
                style={{ borderColor: archetype.color }}
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.04, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div className="relative mb-2 flex min-w-0 items-center gap-2">
              <motion.div
                animate={isSelected ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: isSelected ? Infinity : 0, ease: "easeInOut" }}
                className="h-2.5 w-2.5 shrink-0"
                style={{ backgroundColor: archetype.color, boxShadow: `0 0 10px ${archetype.color}` }}
              />
              <span
                className="min-w-0 break-words font-headline text-sm font-bold uppercase tracking-[0.1em] transition-colors sm:tracking-[0.15em]"
                style={{ color: isSelected ? archetype.color : "#E8E6E3" }}
              >
                {archetype.name}
              </span>
            </div>
            <p className="relative font-mono text-[11px] leading-relaxed text-neural-white/65">
              {archetype.description}
            </p>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
