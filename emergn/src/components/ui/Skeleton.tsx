import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as inline-block instead of block-level. */
  inline?: boolean;
}

/**
 * Brand-aligned skeleton placeholder.
 *
 * Uses the existing `animate-shimmer` keyframe from globals.css (no extra CSS
 * needed) and never adds border-radius — rounded corners violate the brand
 * rule globally enforced in globals.css.
 *
 * Use it during data-loading transitions where a flash of empty space would
 * otherwise look broken. Sizing comes from the className you pass in (height,
 * width, margins).
 */
export function Skeleton({ className, inline, ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        inline ? "inline-block" : "block",
        "relative overflow-hidden bg-ghost-gray/50",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-pulse-cyan/10 before:to-transparent before:animate-[shimmer_2.4s_linear_infinite]",
        className,
      )}
      {...rest}
    />
  );
}

/** Convenience: a single text-row skeleton sized like body text. */
export function SkeletonLine({
  className,
  width = "100%",
}: {
  className?: string;
  width?: string | number;
}) {
  return (
    <Skeleton
      className={cn("h-3", className)}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    />
  );
}
