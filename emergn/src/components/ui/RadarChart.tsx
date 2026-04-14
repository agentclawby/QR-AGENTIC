"use client";

import { motion } from "framer-motion";
import { useInView } from "@/hooks/useInView";
import type { SentienceDimension } from "@/types";

interface RadarChartProps {
  dimensions: SentienceDimension[];
  size?: number;
}

export function RadarChart({ dimensions, size = 300 }: RadarChartProps) {
  const { ref, isInView } = useInView(0.3);
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (2 * Math.PI) / dimensions.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, scale: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: center + Math.cos(angle) * radius * scale,
      y: center + Math.sin(angle) * radius * scale,
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = dimensions.map((dim, i) =>
    getPoint(i, dim.value / dim.maxScore)
  );
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div ref={ref} className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[300px]"
      >
        {/* Grid pentagons */}
        {gridLevels.map((level) => {
          const points = dimensions
            .map((_, i) => {
              const p = getPoint(i, level);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="rgba(42, 42, 53, 0.6)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const p = getPoint(i, 1);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(42, 42, 53, 0.4)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <motion.path
          d={dataPath}
          fill="rgba(0, 240, 255, 0.1)"
          stroke="#00F0FF"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#00F0FF"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        ))}

        {/* Labels */}
        {dimensions.map((dim, i) => {
          const p = getPoint(i, 1.25);
          return (
            <text
              key={dim.name}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-neural-white/60 font-mono text-[9px] uppercase tracking-wider"
            >
              {dim.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
