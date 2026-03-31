import { Img, staticFile } from "remotion";
import { useScale } from "../hooks/useScale";
import type { BrandingSchema } from "../types/config";
import { z } from "zod";

type BrandingConfig = z.infer<typeof BrandingSchema>;

interface BottomBarProps {
  branding: BrandingConfig;
}

export const BottomBar: React.FC<BottomBarProps> = ({ branding }) => {
  const { s } = useScale();
  if (!branding.show) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: s(230),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${s(80)}px`,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: s(20) }}>
        {branding.logo ? (
          <Img
            src={staticFile(branding.logo)}
            style={{
              height: s(150),
              width: s(150),
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
            fontSize: s(29),
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
            fontSize: s(29),
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
