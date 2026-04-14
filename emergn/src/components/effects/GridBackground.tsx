"use client";

import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  className?: string;
  perspective?: boolean;
}

export function GridBackground({ className, perspective = false }: GridBackgroundProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          ...(perspective && {
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center top",
          }),
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}
