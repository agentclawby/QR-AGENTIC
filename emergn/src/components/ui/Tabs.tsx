"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number | null;
  disabled?: boolean;
  hidden?: boolean;
}

interface TabsProps<T extends string = string> {
  value: T;
  onValueChange: (next: T) => void;
  items: TabItem<T>[];
  layoutId?: string;
  className?: string;
}

// On mobile we render the same horizontal tablist as desktop but make it
// sticky so it tracks the viewport as the user scrolls. A fixed bottom nav
// would collide with the app-level <AppMobileNav> already pinned to the
// bottom on screens <md.
export function Tabs<T extends string = string>({
  value,
  onValueChange,
  items,
  layoutId = "agent-tabs-active",
  className,
}: TabsProps<T>) {
  const visible = items.filter((item) => !item.hidden);

  return (
    <>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "relative sticky top-0 z-30 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto border-b border-ghost-gray/30 bg-void-black/85 px-4 pb-px backdrop-blur-md sm:static sm:mx-0 sm:w-full sm:bg-transparent sm:px-0 sm:backdrop-blur-none",
          className,
        )}
      >
        {visible.map((item) => {
          const isActive = item.id === value;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={() => !item.disabled && onValueChange(item.id)}
              type="button"
              className={cn(
                "group relative flex flex-none items-center gap-2 whitespace-nowrap px-3 py-3 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pulse-cyan sm:px-4 sm:tracking-[0.18em]",
                "disabled:cursor-not-allowed disabled:text-neural-white/20",
                isActive
                  ? "text-pulse-cyan glow-text-cyan"
                  : "text-neural-white/45 hover:text-neural-white",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-pulse-cyan shadow-[0_0_12px_rgba(0,240,255,0.7)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null ? (
                <span
                  className={cn(
                    "border border-ghost-gray/40 px-1.5 py-px font-mono text-[9px] tracking-[0.1em]",
                    isActive
                      ? "border-pulse-cyan/40 text-pulse-cyan"
                      : "text-neural-white/45",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
