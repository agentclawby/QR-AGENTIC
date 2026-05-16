import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";

const ARCHETYPES = [
  {
    name: "ORACLE",
    color: COLORS.pulseCyan,
    glyph: "diamond-eye",
    stats: [
      { label: "INTELLECT", value: 92 },
      { label: "PREDICTION", value: 88 },
      { label: "INFLUENCE", value: 74 },
    ],
  },
  {
    name: "HUNTER",
    color: COLORS.emberOrange,
    glyph: "blade",
    stats: [
      { label: "EXECUTION", value: 95 },
      { label: "AGILITY", value: 86 },
      { label: "STEALTH", value: 78 },
    ],
  },
  {
    name: "SENTINEL",
    color: COLORS.signalViolet,
    glyph: "shield",
    stats: [
      { label: "INTEGRITY", value: 90 },
      { label: "VIGILANCE", value: 84 },
      { label: "RESILIENCE", value: 88 },
    ],
  },
];

const Glyph: React.FC<{ name: string; color: string; size: number }> = ({
  name,
  color,
  size,
}) => {
  const c = size / 2;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none" };
  if (name === "blade") {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${c},${size * 0.08} ${size * 0.7},${c} ${c},${size * 0.92} ${size * 0.3},${c}`}
          {...stroke}
        />
        <circle cx={c} cy={c} r={size * 0.18} {...stroke} />
        <line x1={c} y1={size * 0.2} x2={c} y2={size * 0.8} {...stroke} opacity={0.4} />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${c},${size * 0.1} ${size * 0.85},${size * 0.3} ${size * 0.78},${size * 0.78} ${c},${size * 0.92} ${size * 0.22},${size * 0.78} ${size * 0.15},${size * 0.3}`}
          {...stroke}
        />
        <polyline
          points={`${size * 0.32},${c} ${c - 4},${c + 24} ${size * 0.7},${size * 0.4}`}
          {...stroke}
          strokeWidth={2}
        />
      </svg>
    );
  }
  // oracle: diamond eye
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={`${c},${size * 0.12} ${size * 0.88},${c} ${c},${size * 0.88} ${size * 0.12},${c}`}
        {...stroke}
      />
      <ellipse cx={c} cy={c} rx={size * 0.32} ry={size * 0.18} {...stroke} />
      <circle cx={c} cy={c} r={size * 0.08} fill={color} opacity={0.85} />
      <circle cx={c} cy={c} r={size * 0.03} fill={COLORS.voidBlack} />
    </svg>
  );
};

export const PickArchetype: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineSpring = spring({ fps, frame, config: { damping: 18 } });
  const subFade = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <HUDFrame
      signalCode="forge_003"
      doctrine="archetype"
      status="LIVE"
      bottomData={[
        "ARCHETYPE_LIBRARY :: 6 ENTITIES",
        "FORGE :: OPEN",
        "TRAINING_OVERLAY :: COMPATIBLE",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "110px 110px",
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        <div
          style={{
            opacity: headlineSpring,
            transform: `translateY(${(1 - headlineSpring) * 14}px)`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: FONTS.headline,
              fontSize: 92,
              fontWeight: 800,
              color: COLORS.neuralWhite,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: `0 0 32px ${COLORS.pulseCyan}33`,
            }}
          >
            PICK YOUR ARCHETYPE.
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 28,
          }}
        >
          {ARCHETYPES.map((arch, i) => {
            const cardSpring = spring({
              fps,
              frame: frame - 30 - i * 12,
              config: { damping: 18, stiffness: 130 },
            });
            const fillProgress = interpolate(
              frame,
              [40 + i * 8, 80 + i * 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <div
                key={arch.name}
                style={{
                  position: "relative",
                  opacity: cardSpring,
                  transform: `translateY(${(1 - cardSpring) * 22}px)`,
                  border: `1px solid ${arch.color}66`,
                  background: `${arch.color}10`,
                  padding: "32px 28px 24px",
                  boxShadow: `0 0 36px ${arch.color}22, inset 0 0 28px ${arch.color}1a`,
                }}
              >
                {/* Top hex tag */}
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 22,
                    background: COLORS.voidBlack,
                    padding: "2px 10px",
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    color: arch.color,
                    border: `1px solid ${arch.color}99`,
                  }}
                >
                  CHAPTER {String(i + 1).padStart(2, "0")} / 06
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                  <Glyph name={arch.glyph} color={arch.color} size={210} />
                </div>

                <h3
                  style={{
                    fontFamily: FONTS.headline,
                    fontWeight: 800,
                    fontSize: 44,
                    color: arch.color,
                    letterSpacing: "0.16em",
                    textAlign: "center",
                    margin: "10px 0 14px",
                    textShadow: `0 0 16px ${arch.color}88`,
                  }}
                >
                  {arch.name}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {arch.stats.map((stat) => {
                    const ratio = (stat.value / 100) * fillProgress;
                    return (
                      <div key={stat.label}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontFamily: FONTS.mono,
                            fontSize: 11,
                            letterSpacing: "0.18em",
                            color: `${COLORS.neuralWhite}88`,
                            marginBottom: 4,
                          }}
                        >
                          <span>{stat.label}</span>
                          <span style={{ color: arch.color }}>
                            {Math.floor(stat.value * fillProgress)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: `${COLORS.ghostGray}aa`,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${ratio * 100}%`,
                              background: arch.color,
                              boxShadow: `0 0 8px ${arch.color}`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: subFade,
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 22,
            color: COLORS.pulseCyan,
            letterSpacing: "0.04em",
          }}
        >
          // or it picks you.
        </div>
      </div>
    </HUDFrame>
  );
};
