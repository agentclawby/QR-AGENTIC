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
  decimals?: number;
  /** Skip the InView gate — start counting immediately on mount. */
  immediate?: boolean;
}

export function Counter({
  end,
  suffix = "",
  prefix = "",
  className,
  duration = 2000,
  decimals = 0,
  immediate = false,
}: CounterProps) {
  const { ref, isInView } = useInView(0.5);
  const count = useCounter(end, duration, immediate || isInView);

  const display = decimals
    ? (count / Math.pow(10, 0)).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : count.toLocaleString();

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {prefix}{display}{suffix}
    </span>
  );
}
