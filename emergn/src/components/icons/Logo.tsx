"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  glyphSize?: number;
}

export function Logo({ className, showWordmark = true, glyphSize = 32 }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-2xl leading-none",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="EMERGN."
        width={glyphSize}
        height={glyphSize}
        priority
        className="block shrink-0"
      />
      {showWordmark && (
        <span className="font-headline font-bold tracking-wider text-neural-white">
          EMERGN<span className="text-pulse-cyan">.</span>
        </span>
      )}
    </span>
  );
}
