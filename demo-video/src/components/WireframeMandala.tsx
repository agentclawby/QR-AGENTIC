import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../brand";

interface Props {
  size?: number;
  primary?: string;
  secondary?: string;
}

// Diamond-shaped sacred-geometry mandala with a glowing eye iris in the
// center. Inspired by banner 01 ("// signal_001"). Slowly rotates and
// breathes to give a "live entity" feel.
export const WireframeMandala: React.FC<Props> = ({
  size = 480,
  primary = COLORS.pulseCyan,
  secondary = COLORS.signalViolet,
}) => {
  const frame = useCurrentFrame();
  const c = size / 2;
  const breath = (Math.sin(frame / 30) + 1) / 2; // 0..1
  const rotation = frame * 0.35;
  const irisGlow = 0.5 + breath * 0.5;
  const radii = [size * 0.12, size * 0.22, size * 0.34, size * 0.45];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        filter: `drop-shadow(0 0 24px ${primary}88)`,
      }}
    >
      <defs>
        <radialGradient id="iris" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={secondary} stopOpacity={1} />
          <stop offset="60%" stopColor={primary} stopOpacity={0.5} />
          <stop offset="100%" stopColor={primary} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Outer diamond */}
      <g transform={`rotate(${rotation * 0.4} ${c} ${c})`}>
        <polygon
          points={`${c},${c - size * 0.45} ${c + size * 0.45},${c} ${c},${c + size * 0.45} ${c - size * 0.45},${c}`}
          fill="none"
          stroke={primary}
          strokeWidth={1.5}
          opacity={0.9}
        />
        <polygon
          points={`${c},${c - size * 0.45} ${c + size * 0.32},${c - size * 0.05} ${c + size * 0.32},${c + size * 0.05} ${c},${c + size * 0.45} ${c - size * 0.32},${c + size * 0.05} ${c - size * 0.32},${c - size * 0.05}`}
          fill="none"
          stroke={primary}
          strokeWidth={1}
          opacity={0.5}
        />
      </g>

      {/* Concentric circles */}
      {radii.map((r, i) => (
        <circle
          key={i}
          cx={c}
          cy={c}
          r={r * (0.95 + breath * 0.05)}
          fill="none"
          stroke={i % 2 === 0 ? primary : secondary}
          strokeWidth={1}
          opacity={0.3 + (i % 2 === 0 ? 0.3 : 0.15)}
          strokeDasharray={i === 0 ? "none" : `${2 + i},${4 + i}`}
        />
      ))}

      {/* Radial spokes */}
      <g transform={`rotate(${-rotation * 0.6} ${c} ${c})`}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI) / 6;
          const x1 = c + Math.cos(angle) * size * 0.15;
          const y1 = c + Math.sin(angle) * size * 0.15;
          const x2 = c + Math.cos(angle) * size * 0.42;
          const y2 = c + Math.sin(angle) * size * 0.42;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={primary}
              strokeWidth={0.6}
              opacity={0.35}
            />
          );
        })}
      </g>

      {/* Iris core */}
      <circle
        cx={c}
        cy={c}
        r={size * 0.11 * (0.9 + breath * 0.15)}
        fill="url(#iris)"
        opacity={irisGlow}
      />
      <circle
        cx={c}
        cy={c}
        r={size * 0.04}
        fill={COLORS.voidBlack}
        stroke={primary}
        strokeWidth={1.2}
      />
      <circle cx={c} cy={c} r={size * 0.012} fill={primary} />
    </svg>
  );
};
