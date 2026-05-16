import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadFont as loadHeadline } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { COLORS } from "../brand";
import { AuroraBackdrop } from "../components/AuroraBackdrop";
import { ScanlineOverlay } from "../components/ScanlineOverlay";
import { AgentOnline } from "../scenes/AgentOnline";
import { TeaserNotYourAssistant } from "../scenes/TeaserNotYourAssistant";
import { TeaserCapabilityFlash } from "../scenes/TeaserCapabilityFlash";
import { ForgeIsOpen } from "../scenes/ForgeIsOpen";

loadHeadline();
loadBody();
loadMono();

// 15s @ 30fps = 450 frames. Four-beat teaser: agent online → not-your-assistant
// stamp → capability flash (3 beats) → forge-is-open CTA. Banner-aligned.
const SCENES: Array<{
  Component: React.FC;
  durationInSeconds: number;
  variant?: "cyan" | "violet" | "ember";
}> = [
  { Component: AgentOnline, durationInSeconds: 3, variant: "cyan" },
  { Component: TeaserNotYourAssistant, durationInSeconds: 3, variant: "violet" },
  { Component: TeaserCapabilityFlash, durationInSeconds: 5, variant: "cyan" },
  { Component: ForgeIsOpen, durationInSeconds: 4, variant: "ember" },
];

export const Teaser: React.FC = () => {
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
