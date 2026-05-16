import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";

interface Props {
  signalCode?: string;
  doctrine?: string;
  timestamp?: string;
  status?: string;
  bottomData?: string[];
  children?: React.ReactNode;
}

// Cyber-HUD chrome that wraps every scene. Mirrors the banner layout:
//   top-left:    // EMERGN. // signal_001
//   top-right:   small EMERGN. wordmark + status block
//   corners:     bracketed L-shapes
//   bottom-left: T-00:00:01 timestamp
//   bottom row:  rotating telemetry strip
export const HUDFrame: React.FC<Props> = ({
  signalCode = "signal_001",
  doctrine,
  timestamp,
  status,
  bottomData = [],
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tickSeconds = Math.floor(frame / fps);
  const tickFrames = String(frame % fps).padStart(2, "0");
  const ts =
    timestamp ??
    `T-${String(Math.floor(tickSeconds / 60)).padStart(2, "0")}:${String(
      tickSeconds % 60,
    ).padStart(2, "0")}.${tickFrames}`;

  // Telemetry rotates every ~1.4s
  const tickerIdx = bottomData.length
    ? Math.floor(frame / (fps * 1.4)) % bottomData.length
    : 0;
  const tickerOpacity = interpolate(
    frame % Math.floor(fps * 1.4),
    [0, 6, fps * 1.4 - 6, fps * 1.4],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const cornerLen = 32;
  const inset = 32;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeIn }}>
      {children}

      {/* Corner brackets */}
      {([
        [inset, inset, "left-top"],
        [inset, inset, "right-top"],
        [inset, inset, "left-bottom"],
        [inset, inset, "right-bottom"],
      ] as const).map(([x, y, position]) => {
        const isRight = position.startsWith("right");
        const isBottom = position.endsWith("bottom");
        return (
          <svg
            key={position}
            width={cornerLen}
            height={cornerLen}
            style={{
              position: "absolute",
              [isRight ? "right" : "left"]: x,
              [isBottom ? "bottom" : "top"]: y,
              opacity: 0.7,
            }}
          >
            <polyline
              points={
                isRight
                  ? isBottom
                    ? `${cornerLen},0 ${cornerLen},${cornerLen} 0,${cornerLen}`
                    : `${cornerLen},${cornerLen} ${cornerLen},0 0,0`
                  : isBottom
                    ? `0,0 0,${cornerLen} ${cornerLen},${cornerLen}`
                    : `0,${cornerLen} 0,0 ${cornerLen},0`
              }
              fill="none"
              stroke={COLORS.pulseCyan}
              strokeWidth={1.5}
            />
          </svg>
        );
      })}

      {/* Top-left: brand mark + signal code */}
      <div
        style={{
          position: "absolute",
          top: inset + 12,
          left: inset + 22,
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.2em",
          color: `${COLORS.neuralWhite}88`,
          textTransform: "uppercase",
          display: "flex",
          gap: 12,
        }}
      >
        <span>// EMERGN.</span>
        <span style={{ color: `${COLORS.pulseCyan}cc` }}>{`// ${signalCode}`}</span>
        {doctrine ? (
          <span style={{ color: `${COLORS.signalViolet}cc` }}>{`// ${doctrine}`}</span>
        ) : null}
      </div>

      {/* Top-right: wordmark + status pill */}
      <div
        style={{
          position: "absolute",
          top: inset + 8,
          right: inset + 22,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {status ? (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: "0.2em",
              color: COLORS.emberOrange,
              border: `1px solid ${COLORS.emberOrange}66`,
              padding: "3px 10px",
              textTransform: "uppercase",
            }}
          >
            STATUS · {status}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: FONTS.headline,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.neuralWhite,
            letterSpacing: "0.15em",
          }}
        >
          EMERGN<span style={{ color: COLORS.pulseCyan }}>.</span>
        </div>
      </div>

      {/* Bottom-left: timestamp */}
      <div
        style={{
          position: "absolute",
          bottom: inset + 28,
          left: inset + 22,
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.2em",
          color: `${COLORS.emberOrange}cc`,
        }}
      >
        {ts}
      </div>

      {/* Bottom-right: hex IDs */}
      <div
        style={{
          position: "absolute",
          bottom: inset + 28,
          right: inset + 22,
          fontFamily: FONTS.mono,
          fontSize: 11,
          letterSpacing: "0.2em",
          color: `${COLORS.neuralWhite}55`,
        }}
      >
        0x{(frame * 7919).toString(16).slice(-6).toUpperCase()} · {durationInFrames}f
      </div>

      {/* Bottom telemetry strip */}
      {bottomData.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: inset + 120,
            right: inset + 200,
            bottom: inset + 28,
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: "0.25em",
            color: `${COLORS.pulseCyan}99`,
            opacity: tickerOpacity,
            textTransform: "uppercase",
          }}
        >
          ▸ {bottomData[tickerIdx]}
        </div>
      ) : null}
    </div>
  );
};
