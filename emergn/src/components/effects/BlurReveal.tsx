"use client";

import { motion, useReducedMotion } from "framer-motion";
import { staggerWords, wordReveal } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface BlurRevealProps {
  text: string;
  className?: string;
  /** Split granularity: words (default) or characters. */
  split?: "words" | "chars";
  /** Re-trigger on every mount instead of waiting for InView. */
  immediate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  delay?: number;
}

/**
 * Cinematic text reveal — splits text into spans, blur-fades + lifts each one.
 * Respects prefers-reduced-motion (renders plain text).
 */
export function BlurReveal({
  text,
  className,
  split = "words",
  immediate = false,
  as: Tag = "h2",
  delay = 0,
}: BlurRevealProps) {
  const reduce = useReducedMotion();
  const tokens = split === "chars" ? Array.from(text) : text.split(/(\s+)/);

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const MotionTag = motion[Tag] as typeof motion.h2;

  return (
    <MotionTag
      className={cn("inline-block", className)}
      variants={{
        ...staggerWords,
        visible: {
          ...staggerWords.visible,
          transition: {
            ...((staggerWords.visible as { transition?: object }).transition ?? {}),
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={{ once: true, margin: "-15%" }}
    >
      {tokens.map((token, i) =>
        /^\s+$/.test(token) ? (
          <span key={i}>{token}</span>
        ) : (
          <motion.span
            key={i}
            variants={wordReveal}
            className="inline-block will-change-transform"
            style={{ transformOrigin: "50% 100%" }}
          >
            {token}
          </motion.span>
        )
      )}
    </MotionTag>
  );
}
