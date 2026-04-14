"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function HolographicCard({
  children,
  className,
  glowColor = "rgba(0, 240, 255, 0.15)",
}: HolographicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -10);
    setRotateY((x - 0.5) * 10);
    setGradientPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGradientPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      style={{ perspective: 1000, "--glow": glowColor } as React.CSSProperties}
      className={cn(
        "relative border border-ghost-gray/50 bg-ghost-gray/20 p-8 transition-shadow duration-300",
        "hover:shadow-[0_0_40px_var(--glow)]",
        className
      )}
    >
      {/* Holographic gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${gradientPos.x}% ${gradientPos.y}%, rgba(0,240,255,0.08), rgba(139,92,246,0.05), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
