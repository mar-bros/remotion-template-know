import React from "react";
import { Img, staticFile } from "remotion";
import type { BrandingSchema } from "../types/config";
import { z } from "zod";

type BrandingConfig = z.infer<typeof BrandingSchema>;

interface BottomBarProps {
  branding: BrandingConfig;
}

export const BottomBar: React.FC<BottomBarProps> = ({ branding }) => {
  if (!branding.show) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "12%", 
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4%",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
        {branding.logo ? (
          <Img
            src={staticFile(branding.logo)}
            style={{
              height: "8vh",
              width: "8vh",
              objectFit: "cover",
              borderRadius: "20%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "#111"
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "2.5vh",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
              letterSpacing: "0.03em"
            }}
          >
            Mar Bro ™
          </span>
        )}
      </div>

      {/* Copyright */}
      {branding.copyright && (
        <span
          style={{
            fontSize: "2.5vh",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "sans-serif",
            letterSpacing: "0.03em",
          }}
        >
          {branding.copyright}
        </span>
      )}
    </div>
  );
};
