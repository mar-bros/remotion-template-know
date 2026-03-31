import { useCurrentFrame, interpolate } from "remotion";
import { useScale } from "../hooks/useScale";
import type { EndCreditsSchema } from "../types/config";
import { z } from "zod";

type EndCreditsConfig = z.infer<typeof EndCreditsSchema>;

interface EndCreditsProps {
  config: EndCreditsConfig;
  startFrame: number; // frame at which end credits begin
}

export const EndCredits: React.FC<EndCreditsProps> = ({ config, startFrame }) => {
  const frame = useCurrentFrame();
  const { s, vv } = useScale();

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
          gap: s(40),
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
                gap: s(15),
                opacity: itemOpacity,
                transform: `translateY(${itemY}px)`,
                marginTop: s(66),
              }}
            >
              <span
                style={{
                  fontSize: vv(1.2),
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "sans-serif",
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
                  fontSize: vv(1.8),
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: "sans-serif",
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
