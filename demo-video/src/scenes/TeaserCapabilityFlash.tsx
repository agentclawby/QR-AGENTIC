import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";

const BEATS = [
  { primary: "X VOICE.", sub: "// imported from your timeline.", color: COLORS.pulseCyan },
  { primary: "AGENT PASSPORT.", sub: "// signed with your Solana wallet.", color: COLORS.signalViolet },
  { primary: "PUBLIC CONSULTS.", sub: "// other people pay to ask.", color: COLORS.emberOrange },
];

export const TeaserCapabilityFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 5s scene split into 3 beats; each beat gets ~1.6s
  const beatLen = Math.floor((fps * 5) / BEATS.length);
  const beatIdx = Math.min(BEATS.length - 1, Math.floor(frame / beatLen));
  const localFrame = frame - beatIdx * beatLen;
  const beatSpring = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, stiffness: 180 },
  });
  const beatExit = interpolate(
    localFrame,
    [beatLen - 8, beatLen],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = beatSpring * beatExit;
  const beat = BEATS[beatIdx];

  return (
    <HUDFrame
      signalCode={`teaser_00${beatIdx + 3}`}
      status="LIVE"
      bottomData={[
        "BEAT " + (beatIdx + 1) + " / " + BEATS.length,
        "EMERGN.ORG",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
          opacity,
          transform: `translateY(${(1 - beatSpring) * 16}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: `${COLORS.neuralWhite}55`,
            fontFamily: FONTS.mono,
            fontSize: 14,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 60,
              height: 1,
              background: beat.color,
              boxShadow: `0 0 8px ${beat.color}`,
            }}
          />
          CHAPTER {String(beatIdx + 1).padStart(2, "0")}
          <span
            aria-hidden
            style={{
              width: 60,
              height: 1,
              background: beat.color,
              boxShadow: `0 0 8px ${beat.color}`,
            }}
          />
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: FONTS.headline,
            fontSize: 180,
            fontWeight: 800,
            color: beat.color,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            textShadow: `0 0 36px ${beat.color}99`,
            lineHeight: 1,
          }}
        >
          {beat.primary}
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.mono,
            fontSize: 28,
            color: `${COLORS.neuralWhite}aa`,
            letterSpacing: "0.05em",
          }}
        >
          {beat.sub}
        </p>
      </div>
    </HUDFrame>
  );
};
