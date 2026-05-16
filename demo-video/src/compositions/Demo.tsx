import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadFont as loadHeadline } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { COLORS } from "../brand";
import { AuroraBackdrop } from "../components/AuroraBackdrop";
import { ScanlineOverlay } from "../components/ScanlineOverlay";
import { AgentOnline } from "../scenes/AgentOnline";
import { AwakeStatement } from "../scenes/AwakeStatement";
import { NotYourAssistant } from "../scenes/NotYourAssistant";
import { PickArchetype } from "../scenes/PickArchetype";
import { IncomingTransmission } from "../scenes/IncomingTransmission";
import { SentienceTelemetry } from "../scenes/SentienceTelemetry";
import { ForgeIsOpen } from "../scenes/ForgeIsOpen";

loadHeadline();
loadBody();
loadMono();

// 60s @ 30fps = 1800 frames. Banner-style demo with cyber-HUD chrome on every
// scene (corner brackets, // EMERGN. // signal_NNN watermark, telemetry strip).
// Aurora hue shifts so scenes feel distinct but stay on-brand.
const SCENES: Array<{
  Component: React.FC;
  durationInSeconds: number;
  variant?: "cyan" | "violet" | "ember";
}> = [
  { Component: AgentOnline, durationInSeconds: 5, variant: "cyan" },
  { Component: AwakeStatement, durationInSeconds: 8, variant: "violet" },
  { Component: NotYourAssistant, durationInSeconds: 9, variant: "cyan" },
  { Component: PickArchetype, durationInSeconds: 10, variant: "violet" },
  { Component: IncomingTransmission, durationInSeconds: 8, variant: "cyan" },
  { Component: SentienceTelemetry, durationInSeconds: 10, variant: "ember" },
  { Component: ForgeIsOpen, durationInSeconds: 10, variant: "cyan" },
];

export const Demo: React.FC = () => {
  let cursor = 0;
  const fps = 30;
  return (
    <AbsoluteFill style={{ background: COLORS.voidBlack }}>
      {SCENES.map(({ Component, durationInSeconds, variant }, idx) => {
        const from = cursor;
        const durationInFrames = Math.round(durationInSeconds * fps);
        cursor += durationInFrames;
        return (
          <Sequence
            key={idx}
            from={from}
            durationInFrames={durationInFrames}
            name={Component.name}
          >
            <AbsoluteFill>
              <AuroraBackdrop variant={variant ?? "cyan"} />
              <Component />
              <ScanlineOverlay opacity={0.22} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
