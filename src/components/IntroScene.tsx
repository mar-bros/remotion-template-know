import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  Video,
  staticFile,
} from "remotion";
import { useScale } from "../hooks/useScale";
import type { IntroSchema, ThemeSchema } from "../types/config";
import { z } from "zod";

type IntroConfig = z.infer<typeof IntroSchema>;
type ThemeConfig = z.infer<typeof ThemeSchema>;

interface IntroSceneProps {
  config: IntroConfig;
  theme: ThemeConfig;
}

/**
 * 首屏介绍组件 (IntroScene)
 * 渲染视频开始时的开场介绍，支持图片/视频背景及多行文字动效。
 */
export const IntroScene: React.FC<IntroSceneProps> = ({ config, theme }) => {
  const frame = useCurrentFrame();
  const { s, vv } = useScale();
  const { fps } = useVideoConfig(); // Need fps for duration math

  // 1. 处理背景素材路径
  const bgAsset =
    config.bgAsset &&
      (config.bgAsset.startsWith("http") || config.bgAsset.startsWith("data:"))
      ? config.bgAsset
      : config.bgAsset
        ? staticFile(config.bgAsset)
        : null;

  // 2. 动画状态计算 (主副标题不再使用入场动效，确保首帧可见以便平台抓取封面)
  const titleProgress = 1;
  const subtitleProgress = 1;

  // 整体淡出效果 (在最后 15 帧开始淡出)
  const durationInFrames = Math.floor(config.duration * fps);
  const fadeOutOpacity = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: theme.fontFamily,
        color: theme.textColor,
        opacity: fadeOutOpacity,
      }}
    >
      {/* 背景渲染逻辑 */}
      {config.bgType !== "none" && bgAsset && (
        <AbsoluteFill>
          {config.bgType === "image" ? (
            <Img
              src={bgAsset}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Video
              src={bgAsset}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
              loop
            />
          )}
          {/* 覆盖层，增加文字可读性 */}
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)" }} />
        </AbsoluteFill>
      )}

      {/* 内容区域 */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: `0 ${vv(2)}px`,
          textAlign: "center",
        }}
      >
        {config.title && (
          <h1
            style={{
              fontSize: vv(4.4),
              fontWeight: 900,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              opacity: titleProgress,
              textShadow: "0 10px 40px rgba(0,0,0,0.8)",
              whiteSpace: "pre-wrap",
            }}
          >
            {config.title}
          </h1>
        )}

        {config.subtitle && (
          <div
            style={{
              marginTop: s(60),
              fontSize: vv(3),
              fontWeight: 600,
              opacity: subtitleProgress,
              whiteSpace: "pre-wrap",
            }}
          >
            {config.subtitle}
          </div>
        )}

        {/* 描述性文本列表 (交错浮现) */}
        <div
          style={{
            margin: s(180),
            display: "flex",
            flexDirection: "column",
            gap: s(40),
          }}
        >
          {config.description?.map((line, i) => {
            const lineSpring = spring({
              frame: frame - 30 - i * 12,
              fps,
              config: { damping: 15 },
            });
            return (
              <div
                key={i}
                style={{
                  lineHeight: vv(0.1),
                  fontSize: vv(1.6),
                  opacity: lineSpring,
                  fontWeight: 400,
                  transform: `translateY(${interpolate(
                    lineSpring,
                    [0, 1],
                    [20, 0]
                  )}px)`,
                  color: "rgba(255,255,255,0.85)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
