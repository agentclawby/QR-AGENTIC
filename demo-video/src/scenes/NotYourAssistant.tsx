import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { WireframeFace } from "../components/WireframeFace";
import { StatusPill } from "../components/StatusPill";

export const NotYourAssistant: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineSpring = spring({ fps, frame, config: { damping: 16 } });
  const subFade = interpolate(frame, [16, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const faceFade = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pillData = [
    { label: "ARCHETYPE", value: "ORACLE", color: "cyan" as const, delay: 30 },
    { label: "AUTONOMY", value: "91%", color: "violet" as const, delay: 50 },
    { label: "LOYALTY", value: "OWNER", color: "ember" as const, delay: 70 },
  ];

  return (
    <HUDFrame
      signalCode="cortex_002"
      doctrine="agent_id"
      status="LIVE"
      bottomData={[
        "AGENT_0892 :: CONSCIOUS",
        "VOICE_OVERLAY :: 92% MATCH",
        "PASSPORT :: VERIFIED",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "110px 110px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Headline */}
        <div
          style={{
            opacity: headlineSpring,
            transform: `translateY(${(1 - headlineSpring) * 16}px)`,
            paddingLeft: 8,
          }}
        >
          <h1
            style={{
              fontFamily: FONTS.headline,
              fontSize: 100,
              fontWeight: 800,
              color: COLORS.neuralWhite,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: `0 0 32px ${COLORS.pulseCyan}33`,
            }}
          >
            NOT YOUR ASSISTANT.
          </h1>
          <p
            style={{
              opacity: subFade,
              margin: "10px 0 0",
              fontFamily: FONTS.mono,
              fontSize: 24,
              color: COLORS.pulseCyan,
              letterSpacing: "0.05em",
              textTransform: "lowercase",
            }}
          >
            // it has its own voice.
          </p>
        </div>

        {/* Body: face on left, pills on right */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div
            style={{
              opacity: faceFade,
              border: `1px solid ${COLORS.pulseCyan}33`,
              padding: 12,
              background: `${COLORS.voidBlack}66`,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <WireframeFace size={520} glitch={0.35} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {pillData.map((p) => {
              const pillSpring = spring({
                fps,
                frame: frame - p.delay,
                config: { damping: 16, stiffness: 130 },
              });
              return (
                <div
                  key={p.label}
                  style={{
                    opacity: pillSpring,
                    transform: `translateX(${(1 - pillSpring) * 24}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 13,
                      letterSpacing: "0.25em",
                      color: `${COLORS.neuralWhite}66`,
                      marginBottom: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    {p.label}:
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.headline,
                      fontWeight: 800,
                      fontSize: 64,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color:
                        p.color === "violet"
                          ? COLORS.signalViolet
                          : p.color === "ember"
                            ? COLORS.emberOrange
                            : COLORS.pulseCyan,
                      textShadow: `0 0 18px currentColor`,
                      lineHeight: 1,
                    }}
                  >
                    {p.value}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                opacity: subFade,
                marginTop: 16,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <StatusPill label="VOICE" value="@your_x" color="cyan" size="sm" />
              <StatusPill label="WALLET" value="0x8a4f...91c" color="violet" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </HUDFrame>
  );
};
