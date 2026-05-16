import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../brand";

interface Props {
  lines: string[];
  prefix?: string;
  fontSize?: number;
  width?: number;
  finalLine?: string;
}

// Left-side code/terminal column. Lines stream in one at a time, the most
// recent line shows a blinking cursor, optional finalLine pulses at the end.
export const CodeStream: React.FC<Props> = ({
  lines,
  prefix = ">",
  fontSize = 22,
  width = 520,
  finalLine,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const linesShown = Math.min(lines.length, Math.floor(frame / (fps * 0.4)));
  const finalShown = frame > lines.length * fps * 0.4;
  const blink = Math.floor(frame / 12) % 2 === 0;

  return (
    <div
      style={{
        width,
        fontFamily: FONTS.mono,
        fontSize,
        color: COLORS.pulseCyan,
        textShadow: `0 0 12px ${COLORS.pulseCyan}66`,
        lineHeight: 1.55,
      }}
    >
      {lines.slice(0, linesShown).map((line, i) => (
        <div
          key={`${i}-${line}`}
          style={{
            opacity: i === linesShown - 1 && !finalShown ? 0.95 : 0.78,
          }}
        >
          <span style={{ color: `${COLORS.pulseCyan}aa`, marginRight: 10 }}>
            {prefix}
          </span>
          {line}
          {i === linesShown - 1 && !finalShown && blink ? (
            <span style={{ color: COLORS.neuralWhite }}>▌</span>
          ) : null}
        </div>
      ))}
      {finalLine && finalShown ? (
        <div
          style={{
            marginTop: 12,
            color: COLORS.emberOrange,
            textShadow: `0 0 14px ${COLORS.emberOrange}88`,
            opacity: blink ? 1 : 0.65,
          }}
        >
          <span style={{ marginRight: 10 }}>{prefix}</span>
          {finalLine}
        </div>
      ) : null}
    </div>
  );
};
