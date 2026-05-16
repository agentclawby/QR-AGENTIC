import React from "react";
import { COLORS, FONTS } from "../brand";

interface Props {
  size?: number;
  glow?: boolean;
}

export const BrandLogo: React.FC<Props> = ({ size = 140, glow = true }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: size * 0.04,
        fontFamily: FONTS.headline,
        fontWeight: 700,
        fontSize: size,
        color: COLORS.neuralWhite,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textShadow: glow
          ? `0 0 24px ${COLORS.pulseCyan}88, 0 0 48px ${COLORS.pulseCyan}33`
          : undefined,
      }}
    >
      <span>EMERGN</span>
      <span style={{ color: COLORS.pulseCyan }}>.</span>
    </div>
  );
};
