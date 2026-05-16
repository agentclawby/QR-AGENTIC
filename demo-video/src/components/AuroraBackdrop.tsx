import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../brand";

interface Props {
  variant?: "cyan" | "violet" | "ember";
}

// Slow, breathing radial gradient that mirrors the landing page atmosphere.
export const AuroraBackdrop: React.FC<Props> = ({ variant = "cyan" }) => {
  const frame = useCurrentFrame();
  const accent =
    variant === "violet"
      ? COLORS.signalViolet
      : variant === "ember"
        ? COLORS.emberOrange
        : COLORS.pulseCyan;

  const t = (Math.sin(frame / 60) + 1) / 2;
  const intensity = interpolate(t, [0, 1], [0.18, 0.32]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(60% 80% at 50% 50%, ${accent}${Math.floor(
          intensity * 255,
        )
          .toString(16)
          .padStart(2, "0")} 0%, transparent 70%), ${COLORS.voidBlack}`,
      }}
    />
  );
};
