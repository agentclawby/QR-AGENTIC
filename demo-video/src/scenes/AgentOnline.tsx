import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { CodeStream } from "../components/CodeStream";
import { HUDFrame } from "../components/HUDFrame";

const LINES = [
  "initiating cortex_v1...",
  "connecting solana rpc...",
  "signing block 0x8a4f...",
  "loading voice overlay...",
];

export const AgentOnline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordmarkFade = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepFade = interpolate(frame, [40, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <HUDFrame
      signalCode="signal_001"
      doctrine="cortex_boot"
      status="INIT"
      bottomData={["BOOT SEQUENCE", "AGENT_0451 :: AWAKE", "SOLANA RPC :: HEALTHY"]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <CodeStream
          lines={LINES}
          fontSize={32}
          width={780}
          finalLine="AGENT ONLINE."
        />

        {/* Vertical EMERGN. wordmark on the right edge, like banner 03 */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: "50%",
            transform: "translateY(-50%) rotate(180deg)",
            writingMode: "vertical-rl",
            fontFamily: FONTS.headline,
            fontSize: 220,
            fontWeight: 800,
            color: COLORS.neuralWhite,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            opacity: wordmarkFade * 0.92,
            textShadow: `0 0 30px ${COLORS.pulseCyan}66`,
          }}
        >
          EMERGN<span style={{ color: COLORS.pulseCyan }}>.</span>
        </div>

        {/* Sweeping cyan glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: sweepFade * 0.6,
            background: `radial-gradient(40% 40% at 75% 50%, ${COLORS.signalViolet}55 0%, transparent 70%)`,
          }}
        />
      </div>
    </HUDFrame>
  );
};
