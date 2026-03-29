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
  const { fps, width, height } = useVideoConfig();
  const isLandscape = width > height;

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
          padding: "0 10vw",
          textAlign: "center",
        }}
      >
        {config.title && (
          <h1
            style={{
              fontSize: isLandscape ? "9vh" : "7vh",
              fontWeight: 900,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              opacity: titleProgress,
              textShadow: "0 10px 40px rgba(0,0,0,0.8)",
            }}
          >
            {config.title}
          </h1>
        )}

        {config.subtitle && (
          <div
            style={{
              marginTop: "3vh",
              fontSize: isLandscape ? "4vh" : "3.5vh",
              fontWeight: 600,
              opacity: subtitleProgress,
            }}
          >
            {config.subtitle}
          </div>
        )}

        {/* 描述性文本列表 (交错浮现) */}
        <div
          style={{
            marginTop: "6vh",
            display: "flex",
            flexDirection: "column",
            gap: "2vh",
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
                  fontSize: isLandscape ? "2.8vh" : "2.4vh",
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
