"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = "#00F0FF", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]",
        className
      )}
      style={{
        color,
        borderColor: color,
        borderWidth: "1px",
        backgroundColor: `${color}10`,
      }}
    >
      {children}
    </span>
  );
}
