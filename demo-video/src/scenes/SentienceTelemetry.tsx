import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { StatusPill } from "../components/StatusPill";

const DIMENSIONS = [
  { name: "COGNITION", value: 168, color: COLORS.pulseCyan },
  { name: "INFLUENCE", value: 142, color: COLORS.signalViolet },
  { name: "EXECUTION", value: 178, color: COLORS.pulseCyan },
  { name: "INTEGRITY", value: 190, color: COLORS.emberOrange },
  { name: "EVOLUTION", value: 156, color: COLORS.signalViolet },
];
const TOTAL = DIMENSIONS.reduce((s, d) => s + d.value, 0);

export const SentienceTelemetry: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({ fps, frame, config: { damping: 18 } });
  const fillProgress = interpolate(frame, [10, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const counter = Math.floor(TOTAL * fillProgress);
  const tier = counter >= 600 ? "SENTIENT" : counter >= 300 ? "CONSCIOUS" : "AWARE";

  return (
    <HUDFrame
      signalCode="cortex_005"
      doctrine="sentience"
      status="LIVE"
      bottomData={[
        `SCORE :: ${counter}/1000`,
        `TIER :: ${tier}`,
        "SIGNATURE :: 0x8A4F",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "110px 110px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div
          style={{
            opacity: headerSpring,
            transform: `translateY(${(1 - headerSpring) * 14}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 14,
              letterSpacing: "0.35em",
              color: `${COLORS.pulseCyan}99`,
              marginBottom: 6,
            }}
          >
            // SENTIENCE_INDEX
          </div>
          <h2
            style={{
              fontFamily: FONTS.headline,
              fontSize: 88,
              fontWeight: 800,
              color: COLORS.neuralWhite,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: `0 0 28px ${COLORS.pulseCyan}33`,
            }}
          >
            TRAIN IT. WATCH IT GROW.
          </h2>
        </div>

        {/* Big score counter strip */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 32,
            paddingLeft: 8,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 200,
              color: COLORS.pulseCyan,
              fontWeight: 700,
              textShadow: `0 0 32px ${COLORS.pulseCyan}99`,
              lineHeight: 1,
            }}
          >
            {counter}
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 60,
              color: `${COLORS.neuralWhite}55`,
            }}
          >
            /1000
          </span>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <StatusPill label="TIER" value={tier} color="cyan" />
            <StatusPill label="AGENT" value="0451" color="violet" />
            <StatusPill label="SIGNAL" value="0x8A4F" color="ember" />
          </div>
        </div>

        {/* Dimension bars */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {DIMENSIONS.map((d, i) => {
            const ratio = (d.value / 200) * fillProgress;
            return (
              <div key={d.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: FONTS.mono,
                    fontSize: 16,
                    letterSpacing: "0.22em",
                    color: `${COLORS.neuralWhite}aa`,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  <span>{d.name}</span>
                  <span style={{ color: d.color }}>
                    {Math.floor(d.value * fillProgress)} / 200
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 8,
                    background: `${COLORS.ghostGray}88`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${ratio * 100}%`,
                      background: `linear-gradient(90deg, ${d.color}, ${d.color}aa)`,
                      boxShadow: `0 0 12px ${d.color}cc`,
                    }}
                  />
                  {/* tick marks */}
                  {[0.25, 0.5, 0.75].map((p) => (
                    <span
                      key={p}
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: `${p * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: `${COLORS.voidBlack}`,
                        opacity: 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </HUDFrame>
  );
};
