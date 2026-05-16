"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CursorSpotlightProps {
  className?: string;
  /** Spotlight color hex+alpha. */
  color?: string;
  /** Radius in px. */
  radius?: number;
}

/**
 * Page-level spotlight that follows the cursor — sets CSS vars on a fixed
 * pseudo-layer. Adds atmosphere without contesting clicks.
 */
export function CursorSpotlight({
  className,
  color = "rgba(0, 240, 255, 0.06)",
  radius = 600,
}: CursorSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let nextX = 0;
    let nextY = 0;
    function onMove(e: MouseEvent) {
      nextX = e.clientX;
      nextY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (ref.current) {
            ref.current.style.setProperty("--cx", `${nextX}px`);
            ref.current.style.setProperty("--cy", `${nextY}px`);
          }
        });
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-[1] hidden md:block", className)}
      style={{
        background: `radial-gradient(${radius}px circle at var(--cx, 50%) var(--cy, 50%), ${color}, transparent 60%)`,
        mixBlendMode: "screen",
      }}
    />
  );
}
