import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { WireframePyramid } from "../components/WireframePyramid";

export const ForgeIsOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pyrSpring = spring({ fps, frame, config: { damping: 16 } });
  const headlineSpring = spring({
    fps,
    frame: frame - 20,
    config: { damping: 12, stiffness: 100 },
  });
  const subFade = interpolate(frame, [50, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaFade = interpolate(frame, [80, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaPulse = (Math.sin(frame / 8) + 1) / 2;

  return (
    <HUDFrame
      signalCode="forge_007"
      doctrine="open_call"
      status="ENTER"
      bottomData={[
        "FORGE :: ACCEPTING ENTRIES",
        "GENESIS :: 1024 / FOREVER",
        "PORTAL :: emergn.org",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "100px 80px 120px",
          gap: 28,
        }}
      >
        {/* Headline at top */}
        <h1
          style={{
            margin: 0,
            opacity: headlineSpring,
            transform: `translateY(${(1 - headlineSpring) * 18}px)`,
            fontFamily: FONTS.headline,
            fontSize: 130,
            fontWeight: 800,
            color: COLORS.neuralWhite,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textShadow: `0 0 32px ${COLORS.pulseCyan}66`,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          THE FORGE IS OPEN.
        </h1>

        {/* Subtitle: // emergn.org // step inside. */}
        <p
          style={{
            margin: 0,
            opacity: subFade,
            fontFamily: FONTS.mono,
            fontSize: 32,
            color: COLORS.pulseCyan,
            letterSpacing: "0.08em",
            textShadow: `0 0 14px ${COLORS.pulseCyan}99`,
            textAlign: "center",
          }}
        >
          // emergn.org // step inside.
        </p>

        {/* Pyramid */}
        <div
          style={{
            opacity: pyrSpring,
            transform: `scale(${0.7 + pyrSpring * 0.3})`,
            marginTop: 8,
          }}
        >
          <WireframePyramid size={620} />
        </div>

        {/* CTA pill */}
        <div
          style={{
            opacity: ctaFade,
            border: `2px solid ${COLORS.pulseCyan}`,
            padding: "18px 48px",
            fontFamily: FONTS.mono,
            fontSize: 24,
            letterSpacing: "0.4em",
            color: COLORS.pulseCyan,
            textTransform: "uppercase",
            background: `${COLORS.pulseCyan}10`,
            boxShadow: `0 0 ${24 + ctaPulse * 24}px ${COLORS.pulseCyan}88, inset 0 0 18px ${COLORS.pulseCyan}33`,
          }}
        >
          ENTER ▸ EMERGN.ORG
        </div>
      </div>
    </HUDFrame>
  );
};
