import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../brand";

interface Props {
  children: React.ReactNode;
  size?: number;
  intensity?: number;
  color?: string;
  weight?: number;
}

// Light RGB-split glitch text. Uses two shadowed layers offset by a frame-driven
// jitter that resolves to zero so the headline lands clean.
export const GlitchText: React.FC<Props> = ({
  children,
  size = 96,
  intensity = 1,
  color = COLORS.neuralWhite,
  weight = 700,
}) => {
  const frame = useCurrentFrame();
  const jitter = Math.sin(frame * 0.6) * 1.6 * intensity;
  const jitterB = Math.cos(frame * 0.45) * 1.2 * intensity;

  return (
    <h1
      style={{
        position: "relative",
        fontFamily: FONTS.headline,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1.04,
        margin: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          color: COLORS.pulseCyan,
          opacity: 0.55,
          transform: `translate(${jitter}px, ${jitterB * -0.4}px)`,
          mixBlendMode: "screen",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          color: COLORS.emberOrange,
          opacity: 0.4,
          transform: `translate(${-jitter}px, ${jitterB * 0.3}px)`,
          mixBlendMode: "screen",
        }}
      >
        {children}
      </span>
      <span style={{ position: "relative" }}>{children}</span>
    </h1>
  );
};
