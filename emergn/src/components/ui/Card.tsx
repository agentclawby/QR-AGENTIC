"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "violet" | "orange";
  hover?: boolean;
}

export function Card({ children, className, glowColor, hover = true }: CardProps) {
  const glowMap = {
    cyan: "hover:border-pulse-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]",
    violet: "hover:border-signal-violet/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]",
    orange: "hover:border-ember-orange/50 hover:shadow-[0_0_30px_rgba(255,107,53,0.1)]",
  };

  return (
    <div
      className={cn(
        "glass-panel p-6 transition-all duration-300",
        hover && glowColor && glowMap[glowColor],
        hover && !glowColor && "hover:border-ghost-gray hover:shadow-[0_0_15px_rgba(232,230,227,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}
