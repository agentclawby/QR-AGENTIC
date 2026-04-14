"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-mono uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer";

  const variants = {
    primary:
      "border border-pulse-cyan bg-pulse-cyan/10 text-pulse-cyan hover:bg-pulse-cyan/20 hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]",
    secondary:
      "border border-ghost-gray bg-ghost-gray/50 text-neural-white hover:border-signal-violet hover:text-signal-violet hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]",
    ghost:
      "text-neural-white/50 hover:text-neural-white",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-[10px]",
    md: "px-6 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm",
  };

  const classes = cn(baseClasses, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
