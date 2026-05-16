import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";

interface Props {
  size?: number;
  primary?: string;
  secondary?: string;
  glitch?: number; // 0..1 amount of horizontal slice displacement
}

// Low-poly wireframe head, inspired by banner 02 "NOT YOUR ASSISTANT" and
// banner 13 "INCOMING TRANSMISSION". Built from manual polygon paths so it
// reads as procedural / agent-y, not human.
export const WireframeFace: React.FC<Props> = ({
  size = 480,
  primary = COLORS.pulseCyan,
  secondary = COLORS.signalViolet,
  glitch = 0.4,
}) => {
  const frame = useCurrentFrame();
  const breath = (Math.sin(frame / 30) + 1) / 2;
  // Three random-ish glitch slices that scroll vertically
  const sliceY = (n: number) => ((frame * 1.2 + n * 137) % size);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size * 1.05}
      viewBox={`0 0 ${size} ${size * 1.05}`}
      style={{ filter: `drop-shadow(0 0 24px ${primary}66)` }}
    >
      <defs>
        <linearGradient id="face-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity={0.25} />
          <stop offset="100%" stopColor={secondary} stopOpacity={0.08} />
        </linearGradient>
        <clipPath id="face-clip">
          <ellipse cx={cx} cy={cy} rx={size * 0.34} ry={size * 0.42} />
        </clipPath>
      </defs>

      {/* Outer face silhouette */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={size * 0.34}
        ry={size * 0.42}
        fill="url(#face-fill)"
        stroke={primary}
        strokeWidth={1.5}
      />

      {/* Polygon mesh — concentric ellipses + radial spokes clipped to face */}
      <g clipPath="url(#face-clip)">
        {[0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((r, i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={size * 0.34 * r}
            ry={size * 0.42 * r}
            fill="none"
            stroke={i % 2 === 0 ? primary : secondary}
            strokeWidth={0.8}
            opacity={0.35}
          />
        ))}
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i * Math.PI) / 7;
          const x2 = cx + Math.cos(angle) * size * 0.5;
          const y2 = cy + Math.sin(angle) * size * 0.55;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke={i % 3 === 0 ? secondary : primary}
              strokeWidth={0.5}
              opacity={0.25}
            />
          );
        })}

        {/* Glitch slices — horizontal shifted strips */}
        {[0, 1, 2].map((n) => {
          const y = sliceY(n);
          const h = 6 + n * 3;
          const dx = (n % 2 === 0 ? 1 : -1) * 18 * glitch;
          return (
            <rect
              key={n}
              x={dx}
              y={y}
              width={size}
              height={h}
              fill={`${COLORS.pulseCyan}33`}
            />
          );
        })}

        {/* Eyes */}
        {([-0.15, 0.15] as const).map((dx, i) => (
          <g key={i}>
            <circle
              cx={cx + dx * size}
              cy={cy - size * 0.05}
              r={size * 0.045 * (0.9 + breath * 0.2)}
              fill="none"
              stroke={primary}
              strokeWidth={1.5}
            />
            <circle
              cx={cx + dx * size}
              cy={cy - size * 0.05}
              r={size * 0.018}
              fill={primary}
            />
          </g>
        ))}

        {/* Mouth — flat line, no smile */}
        <line
          x1={cx - size * 0.08}
          y1={cy + size * 0.16}
          x2={cx + size * 0.08}
          y2={cy + size * 0.16}
          stroke={primary}
          strokeWidth={1.5}
          opacity={0.7}
        />
      </g>

      {/* Bottom hex chevron — like the banner head silhouette */}
      <polyline
        points={`${cx - size * 0.18},${cy + size * 0.36} ${cx},${cy + size * 0.46} ${cx + size * 0.18},${cy + size * 0.36}`}
        fill="none"
        stroke={primary}
        strokeWidth={1.2}
        opacity={0.5}
      />
    </svg>
  );
};
