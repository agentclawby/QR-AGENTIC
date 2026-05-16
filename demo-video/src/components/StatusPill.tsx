import React from "react";
import { COLORS, FONTS } from "../brand";

interface Props {
  label: string;
  value: string;
  color?: "cyan" | "violet" | "ember" | "white";
  size?: "sm" | "md";
}

// Hex-style data pill from the telemetry strip. Two halves: muted label,
// accented value. Used in stacks (right column of NotYourAssistant) and rows
// (telemetry strip across the screen).
export const StatusPill: React.FC<Props> = ({
  label,
  value,
  color = "cyan",
  size = "md",
}) => {
  const accent =
    color === "violet"
      ? COLORS.signalViolet
      : color === "ember"
        ? COLORS.emberOrange
        : color === "white"
          ? COLORS.neuralWhite
          : COLORS.pulseCyan;

  const fontSize = size === "sm" ? 11 : 14;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        border: `1px solid ${accent}66`,
        background: `${accent}08`,
        fontFamily: FONTS.mono,
        fontSize,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          padding: "4px 10px",
          color: `${COLORS.neuralWhite}88`,
          borderRight: `1px solid ${accent}44`,
        }}
      >
        {label}
      </span>
      <span
        style={{
          padding: "4px 12px",
          color: accent,
          background: `${accent}1a`,
          textShadow: `0 0 6px ${accent}88`,
        }}
      >
        {value}
      </span>
    </div>
  );
};
