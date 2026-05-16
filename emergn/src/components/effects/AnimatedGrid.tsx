"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedGridProps {
  className?: string;
  /** Cell size in px. */
  size?: number;
  /** Faint sweeping highlight along the diagonal. */
  sweep?: boolean;
  variant?: "cyan" | "violet" | "white";
}

const colorMap = {
  cyan: "rgba(0, 240, 255, 0.08)",
  violet: "rgba(139, 92, 246, 0.08)",
  white: "rgba(232, 230, 227, 0.05)",
};

/**
 * Animated grid backdrop with optional diagonal sweep.
 * Static grid is pure CSS; the sweep uses a slow Framer Motion gradient pan.
 */
export function AnimatedGrid({ className, size = 60, sweep = true, variant = "white" }: AnimatedGridProps) {
  const lineColor = colorMap[variant];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`,
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      {sweep && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0], backgroundPosition: ["0% 0%", "200% 200%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 0%, rgba(0,240,255,0.06) 45%, rgba(139,92,246,0.06) 55%, transparent 100%)",
            backgroundSize: "200% 200%",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
