"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "violet" | "orange";
  hover?: boolean;
  /** Adds cursor-tracking spotlight + subtle tilt. Use for prominent surfaces. */
  interactive?: boolean;
  /** When true, replaces glass-panel with the deeper card-depth treatment. */
  depth?: boolean;
}

export function Card({
  children,
  className,
  glowColor,
  hover = true,
  interactive = false,
  depth = false,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const x = useSpring(mvX, { stiffness: 180, damping: 22 });
  const y = useSpring(mvY, { stiffness: 180, damping: 22 });
  const rotateX = useTransform(y, [0, 1], [3, -3]);
  const rotateY = useTransform(x, [0, 1], [-3, 3]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mvX.set((e.clientX - rect.left) / rect.width);
    mvY.set((e.clientY - rect.top) / rect.height);
    ref.current.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    ref.current.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleLeave = () => {
    mvX.set(0.5);
    mvY.set(0.5);
  };

  const glowMap = {
    cyan: "hover:border-pulse-cyan/50 hover:shadow-[0_0_40px_rgba(0,240,255,0.18),inset_0_1px_0_rgba(0,240,255,0.12)]",
    violet: "hover:border-signal-violet/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(139,92,246,0.12)]",
    orange: "hover:border-ember-orange/50 hover:shadow-[0_0_40px_rgba(255,107,53,0.18),inset_0_1px_0_rgba(255,107,53,0.12)]",
  };

  const baseClass = depth ? "card-depth p-6" : "glass-panel p-6 transition-all duration-400";
  const classes = cn(
    "relative",
    baseClass,
    interactive && "spotlight",
    hover && glowColor && !depth && glowMap[glowColor],
    hover && !glowColor && !depth && "hover:border-ghost-gray hover:shadow-[0_0_15px_rgba(232,230,227,0.05)]",
    className
  );

  if (!interactive) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={cn(classes, "[transform-style:preserve-3d]")}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
