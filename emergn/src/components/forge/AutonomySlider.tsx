"use client";

import { AUTONOMY_DESCRIPTIONS } from "@/lib/agent-constants";

interface AutonomySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function AutonomySlider({ value, onChange }: AutonomySliderProps) {
  return (
    <div>
      {/* Level display */}
      <div className="mb-6 text-center">
        <span className="font-mono text-4xl font-bold text-pulse-cyan">
          {value}
        </span>
        <span className="font-mono text-lg text-neural-white/30">/10</span>
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-ghost-gray/30 [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-pulse-cyan [&::-webkit-slider-thumb]:bg-pulse-cyan [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.4)]"
        />

        {/* Bar fill */}
        <div
          className="pointer-events-none absolute top-[11px] left-0 h-1"
          style={{
            width: `${((value - 1) / 9) * 100}%`,
            background: `linear-gradient(to right, #2A2A35, ${value >= 7 ? "#FF6B35" : "#00F0FF"})`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="mb-6 flex justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/20">
          Human Control
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neural-white/20">
          Full Autonomy
        </span>
      </div>

      {/* Description */}
      <div className="border border-ghost-gray/20 bg-ghost-gray/5 p-4">
        <p className="font-mono text-xs leading-relaxed text-neural-white/60">
          {AUTONOMY_DESCRIPTIONS[value]}
        </p>
      </div>
    </div>
  );
}
