import React from "react";
import { COLORS } from "../brand";

// Top-edge hairline accent. Mirrors the `.hairline` class in globals.css.
export const Hairline: React.FC<{ position?: "top" | "bottom" }> = ({
  position = "top",
}) => (
  <span
    aria-hidden
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      [position]: 0,
      background: `linear-gradient(90deg, transparent, ${COLORS.pulseCyan}66, transparent)`,
    }}
  />
);
