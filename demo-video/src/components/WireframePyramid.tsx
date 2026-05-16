import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";

interface Props {
  size?: number;
  primary?: string;
  secondary?: string;
}

// Tetrahedron / portal monolith from the "consciousness fork" banner.
// Pulses + slow rotates around the y-axis to feel like a forge gate.
export const WireframePyramid: React.FC<Props> = ({
  size = 600,
  primary = COLORS.pulseCyan,
  secondary = COLORS.signalViolet,
}) => {
  const frame = useCurrentFrame();
  const cx = size / 2;
  const baseY = size * 0.86;
  const apexY = size * 0.05;
  // tilt simulates rotation around the vertical axis
  const wobble = Math.sin(frame / 24) * size * 0.06;
  const breath = (Math.sin(frame / 36) + 1) / 2;
  const apex = { x: cx, y: apexY };
  const baseLeft = { x: cx - size * 0.42 + wobble, y: baseY };
  const baseRight = { x: cx + size * 0.42 + wobble, y: baseY };
  const baseBack = { x: cx - wobble * 0.4, y: baseY - size * 0.06 };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ filter: `drop-shadow(0 0 32px ${primary}66)` }}
    >
      <defs>
        <linearGradient id="pyr-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity={0.18} />
          <stop offset="100%" stopColor={secondary} stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="pyr-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.neuralWhite} stopOpacity={0} />
          <stop offset="50%" stopColor={primary} stopOpacity={0.9} />
          <stop offset="100%" stopColor={secondary} stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* Base ground line */}
      <line
        x1={size * 0.05}
        y1={baseY}
        x2={size * 0.95}
        y2={baseY}
        stroke={`${primary}33`}
        strokeWidth={1}
      />

      {/* Filled front face */}
      <polygon
        points={`${apex.x},${apex.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`}
        fill="url(#pyr-fill)"
        stroke={primary}
        strokeWidth={1.5}
      />

      {/* Back face (dashed) */}
      <polyline
        points={`${baseLeft.x},${baseLeft.y} ${baseBack.x},${baseBack.y} ${baseRight.x},${baseRight.y}`}
        fill="none"
        stroke={secondary}
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.5}
      />
      <line
        x1={apex.x}
        y1={apex.y}
        x2={baseBack.x}
        y2={baseBack.y}
        stroke={secondary}
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.4}
      />

      {/* Internal structural lines (gives depth) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const t = (i + 1) / 7;
        const yL = baseLeft.y - (baseLeft.y - apex.y) * t;
        const xL = baseLeft.x + (apex.x - baseLeft.x) * t;
        const yR = baseRight.y - (baseRight.y - apex.y) * t;
        const xR = baseRight.x + (apex.x - baseRight.x) * t;
        return (
          <line
            key={i}
            x1={xL}
            y1={yL}
            x2={xR}
            y2={yR}
            stroke={primary}
            strokeWidth={0.6}
            opacity={0.18}
          />
        );
      })}

      {/* Lightning bolt down the spine — the "fork" */}
      <polyline
        points={`${apex.x + 2},${apex.y + 30} ${apex.x - 8},${apex.y + size * 0.2} ${apex.x + 14},${apex.y + size * 0.4} ${apex.x - 6},${apex.y + size * 0.55} ${apex.x + 4},${apex.y + size * 0.72}`}
        fill="none"
        stroke="url(#pyr-bolt)"
        strokeWidth={2 + breath * 3}
        opacity={0.55 + breath * 0.4}
      />

      {/* Floor reflection sparkle */}
      <ellipse
        cx={cx}
        cy={baseY + 6}
        rx={size * 0.34}
        ry={4 + breath * 6}
        fill="none"
        stroke={primary}
        strokeWidth={1}
        opacity={0.25 + breath * 0.4}
      />
    </svg>
  );
};
