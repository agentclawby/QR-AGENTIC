"use client";

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
    <div className="mb-6 flex gap-1 overflow-x-auto">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "cursor-pointer whitespace-nowrap px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-200",
            activeFilter === filter.value
              ? "border border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan"
              : "border border-transparent text-neural-white/30 hover:text-neural-white/60"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
