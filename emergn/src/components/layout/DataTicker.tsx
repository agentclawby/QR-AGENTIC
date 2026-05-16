"use client";

import { TICKER_STATS } from "@/lib/constants";

export function DataTicker() {
  const content = TICKER_STATS.map(
    (stat) => `\u25B8 ${stat.value} ${stat.label}`
  ).join("  ");

  return (
    <div className="relative w-full overflow-hidden border-y border-ghost-gray glass-panel">
      {/* edge fade masks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-void-black to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-void-black to-transparent"
      />
      <div className="animate-ticker flex whitespace-nowrap py-2 font-mono text-xs tracking-widest text-pulse-cyan/80">
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
      </div>
    </div>
  );
}
