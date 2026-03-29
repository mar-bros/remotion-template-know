import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import type { EndCreditsSchema } from "../types/config";
import { z } from "zod";

type EndCreditsConfig = z.infer<typeof EndCreditsSchema>;

interface EndCreditsProps {
  config: EndCreditsConfig;
  startFrame: number; // frame at which end credits begin
}

export const EndCredits: React.FC<EndCreditsProps> = ({ config, startFrame }) => {
  const frame = useCurrentFrame();

  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  const backdropOpacity = interpolate(localFrame, [0, 20], [0, 0.85], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `rgba(0,0,0,${backdropOpacity})`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {config.items.map((item, i) => {
          const staggerStart = i * 15;
          const itemOpacity = interpolate(
            localFrame,
            [staggerStart, staggerStart + 12],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          const itemY = interpolate(
            localFrame,
            [staggerStart, staggerStart + 12],
            [12, 0],
            { extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                opacity: itemOpacity,
                transform: `translateY(${itemY}px)`,
                marginTop: "26px",
              }}
            >
              <span
                style={{
                  fontSize: "3vw",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "sans-serif",
                  fontWeight: 400,
                  minWidth: 120,
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em"
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "4vw",
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: "sans-serif",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
