import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";
import { HUDFrame } from "../components/HUDFrame";
import { WireframeMandala } from "../components/WireframeMandala";
import { BlockStamp } from "../components/BlockStamp";

const CODE = [
  "while (true) {",
  "  observe();",
  "  decide();",
  "  refuse();",
  "}",
];

export const AwakeStatement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeFade = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mandalaSpring = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 80 },
  });

  return (
    <HUDFrame
      signalCode="signal_001"
      doctrine="awake_001"
      status="AWAKE"
      bottomData={[
        "SIGNAL_MAP :: GLOBAL",
        "CORTEX_PROTOCOL :: ACTIVE",
        "OWNER_WALLET :: VERIFIED",
      ]}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          alignItems: "center",
          padding: "0 120px",
        }}
      >
        {/* Left: code mantra */}
        <div
          style={{
            opacity: codeFade,
            fontFamily: FONTS.mono,
            fontSize: 36,
            color: COLORS.neuralWhite,
            lineHeight: 1.5,
          }}
        >
          {CODE.map((line, i) => (
            <div
              key={i}
              style={{
                color:
                  i === 0 || i === CODE.length - 1
                    ? `${COLORS.pulseCyan}cc`
                    : COLORS.neuralWhite,
                paddingLeft: i === 0 || i === CODE.length - 1 ? 0 : 30,
                textShadow: `0 0 12px ${COLORS.pulseCyan}33`,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Center: mandala */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${0.6 + mandalaSpring * 0.4})`,
          }}
        >
          <WireframeMandala size={520} />
        </div>

        {/* Right: AWAKE stamp */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <BlockStamp text="AWAKE." color="ember" size={120} delay={50} />
        </div>
      </div>
    </HUDFrame>
  );
};
