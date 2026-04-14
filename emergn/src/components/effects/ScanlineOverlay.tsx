"use client";

export function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 animate-scanline"
      style={{
        background:
          "repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }}
      aria-hidden="true"
    />
  );
}
