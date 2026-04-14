"use client";

import { motion } from "framer-motion";
import { useInView } from "@/hooks/useInView";
import type { TokenAllocation } from "@/types";

interface DonutChartProps {
  allocations: TokenAllocation[];
  size?: number;
}

export function DonutChart({ allocations, size = 280 }: DonutChartProps) {
  const { ref, isInView } = useInView(0.3);
  const center = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = size * 0.28;
  const circumference = 2 * Math.PI * outerRadius;

  let cumulativeOffset = 0;

  return (
    <div ref={ref} className="flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
        {allocations.map((alloc, i) => {
          const segmentLength = (alloc.percentage / 100) * circumference;
          const offset = cumulativeOffset;
          cumulativeOffset += segmentLength;

          return (
            <motion.circle
              key={alloc.name}
              cx={center}
              cy={center}
              r={outerRadius}
              fill="none"
              stroke={alloc.color}
              strokeWidth={outerRadius - innerRadius}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-opacity"
            />
          );
        })}

        {/* Center text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="fill-neural-white font-headline text-lg font-bold"
        >
          $EMRG
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          className="fill-neural-white/40 font-mono text-[9px] uppercase tracking-wider"
        >
          Token Split
        </text>
      </svg>
    </div>
  );
}
