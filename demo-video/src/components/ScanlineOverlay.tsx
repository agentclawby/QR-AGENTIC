import React from "react";
import { useCurrentFrame } from "remotion";

// Subtle scrolling scanlines + vignette to give every scene a CRT/agent-HQ feel
// without distracting from text. Brand-consistent with the landing page overlay.
export const ScanlineOverlay: React.FC<{ opacity?: number }> = ({
  opacity = 0.18,
}) => {
  const frame = useCurrentFrame();
  const offset = (frame * 0.5) % 4;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(232, 230, 227, ${opacity * 0.4}) 0px,
            rgba(232, 230, 227, ${opacity * 0.4}) 1px,
            transparent 1px,
            transparent 4px
          )`,
          backgroundPosition: `0 ${offset}px`,
          mixBlendMode: "overlay",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(10,10,15,0.85) 95%)",
        }}
      />
    </>
  );
};
