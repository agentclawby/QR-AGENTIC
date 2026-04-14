"use client";

import { useCounter } from "@/hooks/useCounter";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function Counter({ end, suffix = "", prefix = "", className, duration = 2000 }: CounterProps) {
  const { ref, isInView } = useInView(0.5);
  const count = useCounter(end, duration, isInView);

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
