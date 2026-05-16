"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  loading?: boolean;
  magnetic?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  loading = false,
  disabled,
  magnetic = true,
  type = "button",
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const x = useSpring(mvX, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(mvY, { stiffness: 220, damping: 18, mass: 0.4 });
  const innerX = useTransform(x, (v) => v * 0.4);
  const innerY = useTransform(y, (v) => v * 0.4);

  function handleMove(e: React.MouseEvent) {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mvX.set((e.clientX - cx) * 0.18);
    mvY.set((e.clientY - cy) * 0.28);
  }

  function handleLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  const baseClasses =
    "relative inline-flex max-w-full items-center justify-center font-mono uppercase tracking-[0.12em] sm:tracking-[0.2em] cursor-pointer select-none overflow-hidden group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse-cyan disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variants = {
    primary:
      "border border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan hover:bg-pulse-cyan/20 hover:shadow-[0_0_30px_rgba(0,240,255,0.5),inset_0_0_18px_rgba(0,240,255,0.25)]",
    secondary:
      "border border-ghost-gray bg-ghost-gray/50 text-neural-white hover:border-signal-violet hover:text-signal-violet hover:shadow-[0_0_30px_rgba(139,92,246,0.4),inset_0_0_18px_rgba(139,92,246,0.18)]",
    ghost:
      "text-neural-white/60 hover:text-pulse-cyan",
    danger:
      "border border-ember-orange bg-ember-orange/10 text-ember-orange hover:bg-ember-orange/20 hover:shadow-[0_0_30px_rgba(255,107,53,0.4),inset_0_0_18px_rgba(255,107,53,0.2)]",
  };

  // min-h-[44px] on mobile keeps every button at the WCAG 2.5.5 touch target.
  // sm:min-h-0 + sm:py-* restore the tighter desktop sizing where pointer
  // input is precise. text size is unchanged across breakpoints.
  const sizes = {
    sm: "min-h-[44px] px-4 py-2 text-[10px] sm:min-h-0 sm:py-1.5",
    md: "min-h-[44px] px-6 py-3 text-xs sm:min-h-0 sm:py-2.5",
    lg: "min-h-[48px] px-8 py-3.5 text-sm",
  };

  const classes = cn(
    baseClasses,
    "transition-[background,border,box-shadow,color] duration-300",
    variants[variant],
    sizes[size],
    className
  );

  const innerContent = (
    <>
      {/* hover sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
          transform: "translateX(-100%)",
          animation: "shimmer 1.6s ease-out",
        }}
      />
      <motion.span
        style={magnetic ? { x: innerX, y: innerY } : undefined}
        className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2 text-center leading-tight"
      >
        {loading ? (
          <>
            <Spinner />
            <span className="opacity-70">Processing</span>
          </>
        ) : (
          children
        )}
      </motion.span>
    </>
  );

  const sharedMotion = {
    style: magnetic ? { x, y } : undefined,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    whileTap: !disabled && !loading ? { scale: 0.97 } : undefined,
  };

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...sharedMotion}
      >
        {innerContent}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...sharedMotion}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {innerContent}
    </motion.button>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
    </svg>
  );
}
