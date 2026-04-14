"use client";

import { useGlitch } from "@/hooks/useGlitch";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  enableHover?: boolean;
}

export function GlitchText({
  children,
  className,
  as: Tag = "span",
  enableHover = true,
}: GlitchTextProps) {
  const { isGlitching, triggerGlitch } = useGlitch();

  return (
    <Tag
      data-text={children}
      className={cn(
        "relative inline-block",
        isGlitching && "glitch-active",
        className
      )}
      onMouseEnter={enableHover ? triggerGlitch : undefined}
    >
      {children}
    </Tag>
  );
}
