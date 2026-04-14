"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-headline text-2xl font-bold tracking-wider text-neural-white",
        className
      )}
    >
      EMERGN<span className="text-pulse-cyan">.</span>
    </span>
  );
}
