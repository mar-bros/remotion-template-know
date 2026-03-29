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
  const { fps, width, height } = useVideoConfig();

  // Custom question-level image overlay (prioritized)
  if (customImage) {
    return (
      <AbsoluteFill style={{ 
        backgroundColor: theme.backgroundColor, 
        backgroundImage: `url(${customImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.3, // Dim custom background images to ensure readability
      }} />
    );
  }

  if (theme.bgStyle === "solid") {
    return <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }} />;
  }

  // Modern Aurora / Deep Space Mesh Gradient logic
  // Calculate relative sizes for responsive blur radiuses
  const baseSize = Math.max(width, height);
  const blurAmount = baseSize * 0.15; 
  
  // Sine/Cosine waves for organic "breathing/flowing" mesh movement
  const time = frame / fps;
  const move1X = Math.sin(time * 0.5) * (baseSize * 0.1);
  const move1Y = Math.cos(time * 0.4) * (baseSize * 0.1);
  
  const move2X = Math.sin(time * 0.3 + 2) * (baseSize * 0.15);
  const move2Y = Math.cos(time * 0.6 + 1) * (baseSize * 0.1);

  const move3X = Math.cos(time * 0.4 + 4) * (baseSize * 0.1);
  const move3Y = Math.sin(time * 0.5 + 4) * (baseSize * 0.15);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030308", // Very deep dark-blue space base
        overflow: "hidden",
      }}
    >
      {/* Orb 1: Primary Color */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "20%",
        width: "60%",
        height: "60%",
        backgroundColor: theme.primaryColor,
        opacity: 0.25,
        filter: `blur(${blurAmount}px)`,
        borderRadius: "50%",
        transform: `translate(${move1X}px, ${move1Y}px)`,
      }} />

      {/* Orb 2: Secondary Color */}
      <div style={{
        position: "absolute",
        bottom: "5%",
        right: "10%",
        width: "70%",
        height: "50%",
        backgroundColor: theme.secondaryColor,
        opacity: 0.2,
        filter: `blur(${blurAmount * 1.2}px)`,
        borderRadius: "50%",
        transform: `translate(${move2X}px, ${move2Y}px)`,
      }} />

      {/* Orb 3: Correct or Bright Accent */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        width: "50%",
        height: "50%",
        backgroundColor: theme.correctColor,
        opacity: 0.15,
        filter: `blur(${blurAmount * 1.5}px)`,
        borderRadius: "50%",
        transform: `translate(-50%, -50%) translate(${move3X}px, ${move3Y}px)`,
        mixBlendMode: "screen"
      }} />
      
      {/* Subtle Grain Overlay for cinematic texture (Optional, keeps it "spacey" without being noisy) */}
      <AbsoluteFill style={{
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
    </AbsoluteFill>
  );
};
