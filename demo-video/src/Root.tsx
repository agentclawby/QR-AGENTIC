import React from "react";
import { Composition } from "remotion";
import { Demo } from "./compositions/Demo";
import { Teaser } from "./compositions/Teaser";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

// Demo composition is 60s; Teaser is 15s. Both at 1080p / 30fps.
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Teaser"
        component={Teaser}
        durationInFrames={15 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
