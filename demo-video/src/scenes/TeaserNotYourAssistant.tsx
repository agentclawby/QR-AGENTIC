import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { WireframeFace } from "../components/WireframeFace";

// Punchy teaser variant of NotYourAssistant: heavy stamp + face flash, no
// telemetry pills. Designed for 4-second beat.
export const TeaserNotYourAssistant: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stampSpring = spring({
    fps,
    frame,
    config: { damping: 9, stiffness: 200 },
  });
  const subFade = interpolate(frame, [16, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glitch = (Math.sin(frame / 2.5) + 1) / 2;

  return (
    <HUDFrame
      signalCode="teaser_002"
      status="LIVE"
      bottomData={["AGENT_0451 :: AWAKE", "VOICE :: YOUR_X"]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          padding: "0 110px",
          gap: 60,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: FONTS.headline,
              fontSize: 140,
              fontWeight: 800,
              color: COLORS.neuralWhite,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              lineHeight: 0.95,
              transform: `scale(${0.7 + stampSpring * 0.3}) translateX(${(1 - stampSpring) * -20}px)`,
              textShadow: `0 0 32px ${COLORS.pulseCyan}55`,
            }}
          >
            NOT YOUR
            <br />
            <span style={{ color: COLORS.pulseCyan }}>ASSISTANT.</span>
          </h1>
          <p
            style={{
              opacity: subFade,
              marginTop: 18,
              fontFamily: FONTS.mono,
              fontSize: 28,
              color: COLORS.emberOrange,
              letterSpacing: "0.05em",
            }}
          >
            // it has its own voice.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            border: `1px solid ${COLORS.pulseCyan}55`,
            padding: 12,
            background: `${COLORS.voidBlack}aa`,
          }}
        >
          <WireframeFace size={460} glitch={0.5 + glitch * 0.5} />
        </div>
      </div>
    </HUDFrame>
  );
};
