"use client";

import { TICKER_STATS } from "@/lib/constants";

export function DataTicker() {
  const content = TICKER_STATS.map(
    (stat) => `\u25B8 ${stat.value} ${stat.label}`
  ).join("  ");

  return (
    <div className="w-full overflow-hidden border-y border-ghost-gray bg-void-black/80 backdrop-blur-sm">
      <div className="animate-ticker flex whitespace-nowrap py-2 font-mono text-xs tracking-widest text-pulse-cyan/70">
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
      </div>
    </div>
  );
}
