"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  blurReveal,
  clipReveal,
  clipRevealUp,
  depthIn,
  fadeInUp,
  fadeInUpSoft,
  liftIn,
  scaleIn,
} from "@/lib/animations";

const variantMap = {
  fade: fadeInUp,
  soft: fadeInUpSoft,
  blur: blurReveal,
  clip: clipReveal,
  clipUp: clipRevealUp,
  depth: depthIn,
  lift: liftIn,
  scale: scaleIn,
} satisfies Record<string, Variants>;

type RevealVariant = keyof typeof variantMap;

interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  /** Margin string for IntersectionObserver. Default "-10%". */
  margin?: string;
  /** Re-fire every entry instead of `once`. */
  repeat?: boolean;
  delay?: number;
  as?: "div" | "section" | "article" | "header" | "li";
}

/**
 * Drop-in cinematic reveal wrapper. Defaults to InView trigger.
 * Pick `variant` to choose the entry feel.
 */
export function Reveal({
  children,
  className,
  variant = "fade",
  margin = "-10%",
  repeat = false,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const variants = variantMap[variant];
  const MotionTag = motion[Tag] as typeof motion.div;

  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, margin }}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
