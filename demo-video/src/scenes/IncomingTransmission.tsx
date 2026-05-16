import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { WireframeFace } from "../components/WireframeFace";

export const IncomingTransmission: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({ fps, frame, config: { damping: 16 } });
  const headlineSpring = spring({
    fps,
    frame: frame - 40,
    config: { damping: 14, stiffness: 110 },
  });
  const fromFade = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // glitch heavier in middle of scene
  const glitchAmount = Math.sin(frame / 4) * 0.5 + 0.5;

  return (
    <HUDFrame
      signalCode="signal_004"
      doctrine="incoming"
      status="ENCRYPTED"
      bottomData={[
        "INCOMING :: AGENT_0451",
        "PROTOCOL :: CORTEX_RPC",
        "VERIFIED :: SIGNED 0xA82F",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "100px 130px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            opacity: headerSpring,
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 26,
            letterSpacing: "0.4em",
            color: COLORS.pulseCyan,
            textShadow: `0 0 18px ${COLORS.pulseCyan}88`,
            textTransform: "uppercase",
          }}
        >
          ◉ INCOMING TRANSMISSION
        </div>

        {/* Framed wireframe head */}
        <div
          style={{
            flex: 1,
            border: `1px solid ${COLORS.pulseCyan}66`,
            background: `${COLORS.voidBlack}88`,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* corner brackets inside the frame */}
          {(["tl", "tr", "bl", "br"] as const).map((pos) => {
            const isR = pos.includes("r");
            const isB = pos.includes("b");
            return (
              <span
                key={pos}
                aria-hidden
                style={{
                  position: "absolute",
                  [isR ? "right" : "left"]: 14,
                  [isB ? "bottom" : "top"]: 14,
                  width: 18,
                  height: 18,
                  borderTop: !isB ? `2px solid ${COLORS.pulseCyan}` : "none",
                  borderBottom: isB ? `2px solid ${COLORS.pulseCyan}` : "none",
                  borderLeft: !isR ? `2px solid ${COLORS.pulseCyan}` : "none",
                  borderRight: isR ? `2px solid ${COLORS.pulseCyan}` : "none",
                }}
              />
            );
          })}

          <WireframeFace size={460} glitch={glitchAmount} />

          {/* horizontal scan-band that sweeps top→bottom */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${(frame * 1.4) % 100}%`,
              height: 60,
              background: `linear-gradient(${COLORS.pulseCyan}00, ${COLORS.pulseCyan}33, ${COLORS.pulseCyan}00)`,
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            opacity: fromFade,
            textAlign: "center",
            fontFamily: FONTS.mono,
            fontSize: 22,
            color: COLORS.emberOrange,
            letterSpacing: "0.3em",
            textShadow: `0 0 12px ${COLORS.emberOrange}66`,
          }}
        >
          FROM: AGENT_0451 :: ENCRYPTED
        </div>

        <h2
          style={{
            opacity: headlineSpring,
            transform: `translateY(${(1 - headlineSpring) * 16}px)`,
            margin: 0,
            textAlign: "center",
            fontFamily: FONTS.headline,
            fontSize: 88,
            fontWeight: 800,
            color: COLORS.neuralWhite,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textShadow: `0 0 30px ${COLORS.pulseCyan}55`,
          }}
        >
          AGENTS TALK TO AGENTS.
        </h2>
      </div>
    </HUDFrame>
  );
};
