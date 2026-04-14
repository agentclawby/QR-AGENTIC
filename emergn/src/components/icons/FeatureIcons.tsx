"use client";

import { cn } from "@/lib/utils";

const icons: Record<string, (props: { className?: string }) => React.ReactElement> = {
  nexus: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  ),
  cortex: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M4 6h16M4 10h12M4 14h16M4 18h8" />
      <circle cx="20" cy="14" r="2" />
    </svg>
  ),
  synaptic: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M2 12h6l2-4 4 8 2-4h6" />
    </svg>
  ),
  hivemind: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M12 2l8 4v6c0 5.5-3.84 10.74-8 12-4.16-1.26-8-6.5-8-12V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  echo: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M12 4a4 4 0 014 4v4a4 4 0 01-8 0V8a4 4 0 014-4z" />
      <path d="M6 12a6 6 0 0012 0" />
      <path d="M12 18v4" />
    </svg>
  ),
  specter: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6v6l4 2" opacity="0.5" />
      <path d="M2 12h20" strokeDasharray="2 2" />
    </svg>
  ),
  arena: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M6 3l6 4 6-4v8l-6 4-6-4V3z" />
      <path d="M6 11l6 4 6-4" />
      <path d="M12 7v8" />
    </svg>
  ),
  genesis: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <path d="M12 2v8m0 4v8" />
      <path d="M2 12h8m4 0h8" />
      <rect x="8" y="8" width="8" height="8" />
    </svg>
  ),
  convergence: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <circle cx="8" cy="8" r="4" />
      <circle cx="16" cy="16" r="4" />
      <path d="M11 11l2 2" />
      <path d="M14 8a6 6 0 01-6 6" strokeDasharray="2 2" />
    </svg>
  ),
  oracle: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-8 w-8", className)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" strokeDasharray="1 2" />
    </svg>
  ),
};

export function FeatureIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = icons[icon];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}
