import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";

interface Props {
  text: string;
  color?: "ember" | "cyan" | "violet";
  size?: number;
  delay?: number;
  bordered?: boolean;
}

// Heavy-stamped block headline like the "AWAKE." badge in the banner art.
// Springs in with a sharp scale + slight skew so it lands like a stamp.
export const BlockStamp: React.FC<Props> = ({
  text,
  color = "ember",
  size = 96,
  delay = 0,
  bordered = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent =
    color === "cyan"
      ? COLORS.pulseCyan
      : color === "violet"
        ? COLORS.signalViolet
        : COLORS.emberOrange;

  const stamp = spring({
    fps,
    frame: frame - delay,
    config: { damping: 8, stiffness: 220, mass: 0.4 },
  });
  const wobble = Math.max(0, 1 - stamp) * 4;

  return (
    <div
      style={{
        display: "inline-block",
        padding: bordered ? `${size * 0.18}px ${size * 0.32}px` : 0,
        border: bordered ? `${Math.max(2, size * 0.04)}px solid ${accent}` : "none",
        background: bordered ? `${accent}10` : "transparent",
        boxShadow: bordered
          ? `0 0 32px ${accent}55, inset 0 0 24px ${accent}22`
          : `0 0 24px ${accent}66`,
        transform: `scale(${0.6 + stamp * 0.4}) rotate(${wobble - 2}deg)`,
        opacity: Math.min(1, stamp * 1.2),
      }}
    >
      <span
        style={{
          fontFamily: FONTS.headline,
          fontSize: size,
          fontWeight: 800,
          color: accent,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: 1,
          textShadow: `0 0 12px ${accent}99`,
        }}
      >
        {text}
      </span>
    </div>
  );
};
