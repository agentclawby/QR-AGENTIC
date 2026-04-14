"use client";

import { cn } from "@/lib/utils";

interface BootProgressProps {
  currentStep: number;
  totalSteps: number;
  accentColor: "cyan" | "violet" | "orange";
}

const colorMap = {
  cyan: "bg-pulse-cyan",
  violet: "bg-signal-violet",
  orange: "bg-ember-orange",
};

const glowMap = {
  cyan: "shadow-[0_0_12px_rgba(0,240,255,0.4)]",
  violet: "shadow-[0_0_12px_rgba(139,92,246,0.4)]",
  orange: "shadow-[0_0_12px_rgba(255,107,53,0.4)]",
};

export function BootProgress({ currentStep, totalSteps, accentColor }: BootProgressProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 border border-ghost-gray/50 transition-all duration-500",
              isCompleted && colorMap[accentColor],
              isCurrent && cn(colorMap[accentColor], glowMap[accentColor], "animate-glow-pulse"),
              !isCompleted && !isCurrent && "bg-ghost-gray/20"
            )}
          />
        );
      })}
    </div>
  );
}
