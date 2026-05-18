"use client";

import { motion } from "framer-motion";
import { shake } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface FormErrorBoxProps {
  message: string | null | undefined;
  /** Tone: 'error' (ember-orange) or 'warning' (pulse-cyan). Defaults to error. */
  tone?: "error" | "warning";
  className?: string;
}

/**
 * Single source of truth for inline form errors. Standardizes the previously
 * bespoke patterns: some components used colored border boxes, some used
 * inline text, some used a shake animation. This wraps the existing `shake`
 * variant from lib/animations.ts so every error animates the same way.
 *
 * Renders nothing when `message` is falsy.
 */
export function FormErrorBox({
  message,
  tone = "error",
  className,
}: FormErrorBoxProps) {
  if (!message) return null;

  const palette =
    tone === "error"
      ? "border-ember-orange/60 text-ember-orange"
      : "border-pulse-cyan/60 text-pulse-cyan";

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      variants={shake}
      initial="rest"
      animate="shake"
      className={cn(
        "border bg-void-black/60 px-3 py-2 font-mono text-xs leading-snug",
        palette,
        className,
      )}
    >
      {message}
    </motion.div>
  );
}
