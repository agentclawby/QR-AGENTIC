"use client";

export function ScanlineOverlay() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-10 animate-scanline"
        style={{
          background:
            "repeating-linear-gradient(transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,0,0,0.05) 4px)",
        }}
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_150px_rgba(10,10,15,1)]"
        aria-hidden="true"
      />
    </>
  );
}
