import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { ThemeSchema } from "../types/config";
import { z } from "zod";

type ThemeConfig = z.infer<typeof ThemeSchema>;

interface BackgroundProps {
  theme: ThemeConfig;
  customImage?: string;
}

export const Background: React.FC<BackgroundProps> = ({ theme, customImage }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If a custom image is explicitly passed via question config, use it exclusively as bg.
  if (customImage) {
    return (
      <AbsoluteFill style={{ 
        backgroundColor: theme.backgroundColor, 
        backgroundImage: `url(${customImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.3 // Dim custom background images to ensure readability
      }} />
    );
  }

  if (theme.bgStyle === "solid") {
    return <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }} />;
  }

  // Universe / Default cool Style
  // Using radial gradients and moving particles (box shadows) simulated by simple animated layers

  // We orbit the center to create a subtle 3D space movement
  const rotation = (frame / fps) * 2; // slowly rotate
  const scale = 1 + Math.sin(frame / fps / 3) * 0.1; // slowly pump scale

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030014", // deep cosmic navy
        backgroundImage: `radial-gradient(ellipse at bottom, ${theme.secondaryColor} 0%, #030014 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Layer 1: Stars using repeating radial gradient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0, rgba(255,255,255,0) 2px)`,
          backgroundSize: "80px 80px",
          opacity: 0.5,
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      />
      
      {/* Layer 2: Larger distant stars, moving slowly in a different direction */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center, rgba(255,255,255,0.6) 0, rgba(255,255,255,0) 3px)`,
          backgroundSize: "200px 200px",
          backgroundPosition: `${(frame / fps) * -10}px ${(frame / fps) * -5}px`,
          opacity: 0.3,
        }}
      />

      {/* Glow overlay for primary color tinting */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 20% 30%, ${theme.primaryColor}22 0%, transparent 60%),
                       radial-gradient(circle at 80% 70%, ${theme.secondaryColor}22 0%, transparent 50%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
