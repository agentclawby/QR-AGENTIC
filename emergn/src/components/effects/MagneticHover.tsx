"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagneticHoverProps {
  children: ReactNode;
  className?: string;
  /** Strength of pull, 0..1. Default 0.18 — tasteful range. */
  strength?: number;
  /** Wrap content with a secondary inner that lags slightly for parallax depth. */
  parallax?: boolean;
}

/**
 * Wraps children with a magnetic cursor pull. Use sparingly — best on
 * focal CTAs, hero icons, or single accent elements. Avoid on dense grids.
 */
export function MagneticHover({
  children,
  className,
  strength = 0.18,
  parallax = false,
}: MagneticHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const x = useSpring(mvX, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(mvY, { stiffness: 220, damping: 18, mass: 0.4 });
  const innerX = useTransform(x, (v) => v * 0.5);
  const innerY = useTransform(y, (v) => v * 0.5);

  function handleMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mvX.set((e.clientX - cx) * strength);
    mvY.set((e.clientY - cy) * strength);
  }

  function handleLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={cn("inline-block", className)}
    >
      {parallax ? (
        <motion.div style={{ x: innerX, y: innerY }}>{children}</motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}
