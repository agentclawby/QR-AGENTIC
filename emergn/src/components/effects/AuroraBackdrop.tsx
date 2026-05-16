"use client";

import { cn } from "@/lib/utils";

interface AuroraBackdropProps {
  className?: string;
  variant?: "default" | "soft" | "violet" | "ember";
  fixed?: boolean;
}

/**
 * Atmospheric aurora gradient backdrop. Pure CSS, animated via globals.css keyframe.
 * Use as a self-contained absolute layer: `<AuroraBackdrop />` inside a `relative` parent.
 */
export function AuroraBackdrop({ className, variant = "default", fixed = false }: AuroraBackdropProps) {
  const variantStyle: Record<NonNullable<AuroraBackdropProps["variant"]>, string> = {
    default:
      "[background:radial-gradient(40%_50%_at_30%_30%,rgba(0,240,255,0.18),transparent_70%),radial-gradient(45%_55%_at_70%_60%,rgba(139,92,246,0.18),transparent_70%),radial-gradient(35%_40%_at_50%_80%,rgba(255,107,53,0.10),transparent_70%)]",
    soft: "[background:radial-gradient(50%_60%_at_20%_30%,rgba(0,240,255,0.10),transparent_70%),radial-gradient(55%_60%_at_80%_70%,rgba(139,92,246,0.10),transparent_70%)]",
    violet:
      "[background:radial-gradient(50%_60%_at_30%_40%,rgba(139,92,246,0.22),transparent_70%),radial-gradient(50%_60%_at_70%_60%,rgba(0,240,255,0.12),transparent_70%)]",
    ember:
      "[background:radial-gradient(45%_55%_at_50%_50%,rgba(255,107,53,0.18),transparent_70%),radial-gradient(50%_60%_at_20%_70%,rgba(139,92,246,0.14),transparent_70%)]",
  };

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none -z-10 blur-[60px] opacity-80 will-change-transform",
        fixed ? "fixed inset-0" : "absolute inset-[-30%]",
        "[animation:var(--animate-aurora)]",
        variantStyle[variant],
        className
      )}
    />
  );
}
