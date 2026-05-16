"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeedPostType } from "@/types";

type FilterOption = FeedPostType | "all";

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "decision", label: "Decisions" },
  { value: "trade", label: "Trades" },
  { value: "analysis", label: "Analysis" },
  { value: "thought", label: "Thoughts" },
  { value: "consultation", label: "Consultations" },
];

interface FeedFiltersProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export function FeedFilters({
  activeFilter,
  onFilterChange,
}: FeedFiltersProps) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <motion.button
            key={filter.value}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "relative cursor-pointer whitespace-nowrap px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 sm:tracking-[0.15em]",
              isActive
                ? "text-pulse-cyan glow-text-cyan"
                : "text-neural-white/50 hover:text-neural-white"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="feed-filter-bg"
                className="absolute inset-0 border border-pulse-cyan bg-pulse-cyan/10 shadow-[0_0_18px_rgba(0,240,255,0.3),inset_0_0_12px_rgba(0,240,255,0.12)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{filter.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
