"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  pulse?: boolean;
  dot?: boolean;
}

export function Badge({ children, color = "#00F0FF", className, pulse = false, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "relative inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] sm:px-3 sm:tracking-[0.2em]",
        className
      )}
      style={{
        color,
        borderColor: color,
        borderWidth: "1px",
        backgroundColor: `${color}10`,
      }}
    >
      {dot && (
        <motion.span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0"
          style={{ background: color }}
          animate={pulse ? { opacity: [0.4, 1, 0.4] } : undefined}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className="relative z-10 truncate">{children}</span>
      {pulse && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: `0 0 0 0 ${color}` }}
          animate={{
            boxShadow: [`0 0 0 0 ${color}66`, `0 0 0 6px ${color}00`],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </span>
  );
}
