import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  staticFile,
  Sequence
} from "remotion";
import type { ThemeSchema } from "../types/config";
import { z } from "zod";
import Markdown from "markdown-to-jsx";
import type { ResolvedQuestion } from "../utils/timing";
import { useScale } from "../hooks/useScale";

type ThemeConfig = z.infer<typeof ThemeSchema>;

interface QuestionSceneProps {
  question: ResolvedQuestion;
  theme: ThemeConfig;
  globalAudio: {
    questionPopSound?: string;
    countdownSound?: string;
    answerRevealSound?: string;
  };
}

/**
 * 核心问答场景组件 (QuestionScene)
 * 负责渲染每个问题、选项、倒计时动画、配图、以及抽屉式的解析页面。
 * 现已统一横屏竖屏的基础排版逻辑：上方永远居中显示【倒计时+题目】，下方区域按比例适配【图片横向或纵向拼接选项】。
 */
export const QuestionScene: React.FC<QuestionSceneProps> = ({
  question,
  theme,
  globalAudio,
}) => {
  const frame = useCurrentFrame();
  const { s, isLandscape } = useScale();
  const { fps } = useVideoConfig();

  // -- 执行时间轴计算阶段 (Timeline Phases) --
  // Enter 阶段: 题目登场、选项进入
  const countdownStartFrame = question.enterDuration;
  // Reveal 阶段: 倒计时结束，展示正确答案，同时高亮
  const revealStartFrame = countdownStartFrame + question.countdownDuration;
  // Explanation 阶段: 答案停留后，下方弹出抽屉解析
  const explanationStartFrame = revealStartFrame + question.revealDuration;

  // 状态布尔值标志，控制各个组件的渲染或状态变更
  const isCountingDown = frame >= countdownStartFrame && frame < revealStartFrame;
  const isRevealed = frame >= revealStartFrame;
  const isExplanation = frame >= explanationStartFrame;

  // -- 核心动画函数 (Animations) --
  // 1. 登场动画（控制组件首次上浮和显示）
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // 2. 抽屉弹出动画（当到达解释阶段时，抽屉面板向上推起）
  const explanationSpring = spring({
    frame: frame - explanationStartFrame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // 3. 场景退出逻辑（处理该题目和下一题的转场淡出）
  const isTransitioningOut =
    frame > question.durationInFrames - question.transitionDuration;
  const transitionOutOpacity = isTransitioningOut
    ? interpolate(
      frame,
      [
        question.durationInFrames - question.transitionDuration,
        question.durationInFrames,
      ],
      [1, 0], // 透明度从1平滑降到0
      { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
    )
    : 1;

  // -- 容器视觉缩放处理 (Scale & Blur interactions) --
  // 当开启解释面板时，主容器缩小、变暗并轻微模糊，提升抽屉内容的视觉层级
  const containerScale = interpolate(explanationSpring, [0, 1], [1, 0.85]);
  const containerBlur = interpolate(explanationSpring, [0, 1], [0, 3]);
  const containerDim = interpolate(explanationSpring, [0, 1], [1, 0.5]);

  // 判断是否为"横屏且无题图"的状态，若是，则界面倾向于左对齐而非居中对齐
  const isLandscapeNoImage = isLandscape && !question.image;

  // 主容器框架（永远作为列形态，容纳顶部的标题与下方的图文内容）
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    padding: isLandscape ? `${s(100)}px ${s(150)}px` : `${s(150)}px ${s(115)}px`, // 控制主页面和边缘的安全边界
    boxSizing: "border-box",
    alignItems: "center", // 重置为整体居中
    justifyContent: "center",
    gap: isLandscape ? s(80) : s(60), // 给标题区块和下方内容提供呼吸感
    opacity: transitionOutOpacity * enterProgress,
    fontFamily: `${theme.fontFamily}, "Noto Sans SC", sans-serif`,
    color: theme.textColor,
    zIndex: 10,
    transform: `scale(${containerScale})`, // 取消初始的向上滑动动效(translateY)以免造成视觉未对齐的迟钝感
    filter: `brightness(${containerDim}) blur(${containerBlur}px)`,
    // 注意：绝对不能在 Remotion 里写 transition: all 或者 filter！由于是逐帧截取，Chromium 补帧会和外框渲染严重打架产生抖动！
  };

  // 毛玻璃卡片的基础样式 (仅包裹内部需要的核心元素，不再无脑拉伸变大)
  const glassStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
    borderRadius: "24px",
    padding: isLandscape ? `${s(60)}px ${s(50)}px` : `${s(65)}px ${s(95)}px`, // 微调了竖屏的上下内边距，使其视觉更加均匀
  };

  // SVG 环形进度倒计时计算
  const timerRadius = isLandscape ? 38 : 45;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = isCountingDown
    ? interpolate(
      frame,
      [countdownStartFrame, revealStartFrame],
      [0, 1],
      { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
    )
    : (isRevealed ? 1 : 0);
  const strokeDashoffset = timerCircumference * timerProgress;

  // -- 独立区块拆分 (模块化拼装以适配横纵比结构) --

  // 1. 顶部标题区块 (SVG倒计时球 + 大字号题目文本)
  const QuestionTitleBlock = (
    <div style={{ display: "flex", alignItems: isLandscapeNoImage ? "center" : "center", gap: s(40), flexDirection: isLandscape ? "row" : "column", width: "100%", marginBottom: isLandscape ? s(80) : s(40) }}>
      {/* 倒计时 */}
      {question.countdownSeconds > 0 && (
        <div style={{ position: "relative", width: timerRadius * 2.2, height: timerRadius * 2.2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={timerRadius * 2.2} height={timerRadius * 2.2} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx={timerRadius * 1.1} cy={timerRadius * 1.1} r={timerRadius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle cx={timerRadius * 1.1} cy={timerRadius * 1.1} r={timerRadius} stroke={theme.primaryColor} strokeWidth="6" fill="none"
              strokeDasharray={timerCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: s(88), fontWeight: "bold", fontFamily: theme.fontFamily }}>
            {isRevealed ? "0" : Math.max(0, Math.ceil((question.countdownDuration - (frame - countdownStartFrame)) / fps))}
          </span>
        </div>
      )}

      {/* 题目正文 (动态尺寸防爆屏) */}
      <h1
        style={{
          fontSize: isLandscape ? s(88) : s(88), // 适当缩减竖屏标题字号，为超长题库让出安全区
          fontWeight: 800,
          lineHeight: 1.4,
          textShadow: "0 4px 12px rgba(0,0,0,0.6)",
          margin: 0,
          flex: 1,
          textAlign: isLandscape ? "left" : "center" // 横屏通常左侧起步，竖屏绝对居中
        }}
      >
        {question.question}
      </h1>
    </div>
  );

  // 判断图片来源，兼容 URL, data:URL 以及工程内部 public 静态引用
  const imageSrc = question.image
    && (question.image.startsWith("http") || question.image.startsWith("data:"))
    ? question.image
    : (question.image ? staticFile(question.image) : null);

  // 3. 选项列表卡片区块 (被精简大小的毛玻璃包裹层)
  const OptionsListBlock = (
    <div style={{
      ...(isLandscape ? glassStyle : {}), // 根据最新反馈，竖屏模式下直接剔除外层共用背景框，使设计更轻量
      display: "flex",
      flexDirection: "column",
      gap: s(30), // 缩减选项之间的留白，解救长文本溢出局促感 
      // 使选项框"紧贴内容"，竖屏修复左右边缘空隙过大的问题
      flex: isLandscape && question.image ? "1 1 auto" : "none", // 横屏有图时占用图片剩下的剩余空间
      width: isLandscape ? (isLandscapeNoImage ? "100%" : "auto") : "100%", // 竖屏占满父级 auto 容器
      alignSelf: isLandscapeNoImage ? "flex-start" : "center",
      maxWidth: isLandscapeNoImage ? "none" : (isLandscape ? s(1150) : s(1630)) // 防长串文本溢出的安全屏障
    }}>
      {question.options.map((opt, i) => {
        // 让选项交错浮现缓冲 (Staggered Animation)
        const staggerFrames = 4 * i;
        const optionEnter = spring({
          frame: frame - staggerFrames,
          fps,
          config: { damping: 14 },
        });

        let bgColor = "rgba(255,255,255,0.02)";
        // 在此处永远保持为 2px border! 避免变色时由于边框从 1px 涨到 2px 而带来的整体布局错位（会导致上下选项全盘疯狂抖动颤抖）
        let outline = `2px solid rgba(255,255,255,0.1)`;
        let opacity = 1;
        let badgeBg = `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)`;

        if (isRevealed) {
          if (opt.isCorrect) {
            bgColor = `${theme.correctColor}33`; // 答对选项绿光背景
            outline = `2px solid ${theme.correctColor}`; // 保持 2px
            badgeBg = theme.correctColor;
          } else {
            bgColor = "rgba(0,0,0,0.1)"; // 错误选项退场暗化
            outline = `2px solid transparent`; // 保持 2px
            opacity = 0.3;
          }
        }

        return (
          <div
            key={opt.id}
            style={{
              padding: isLandscape ? `${s(35)}px ${s(40)}px` : `${s(40)}px ${s(60)}px`, // 再次极限瘦身竖屏的上下内边距，防截断
              borderRadius: "16px",
              background: bgColor,
              border: outline,
              fontSize: isLandscape ? s(66) : s(66), // 统一竖屏字体
              fontWeight: 600,
              opacity: optionEnter * opacity,
              display: "flex",
              alignItems: "center",
              gap: s(40),
              boxShadow: isRevealed && opt.isCorrect ? `0 0 30px ${theme.correctColor}55` : "none",
              // 绝对禁止在这里写 transition! Remotion 的非实时性会导致 transition 失帧引起选项肉眼可见的鬼畜抖动！
            }}
          >
            {/* 左侧的 A/B/C 悬浮圆球设计 */}
            <div style={{
              minWidth: s(105),
              height: s(105),
              borderRadius: "50%",
              background: badgeBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: isRevealed && opt.isCorrect ? "#FFF" : theme.primaryColor,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              // 关键：彻底剔除 A/B/C 圆球的 transition，防止 Remotion 渲染抽搐！
            }}>
              {opt.id}
            </div>
            {/* 右侧选项长文本自适应 */}
            <span style={{ lineHeight: 1.4 }}>{opt.text}</span>
          </div>
        );
      })}
    </div>
  );

  // 判断并解析音频路径
  const resolveAudio = (src?: string) => {
    if (!src) return undefined;
    if (src.startsWith("http") || src.startsWith("data:")) return src;
    return staticFile(src);
  };

  return (
    <AbsoluteFill>

      {/* 声音触发层: 必须使用 Sequence 包裹 Audio 才能保证在时间轴完整播放，直接条件渲染会导致1帧后静音卸载 */}
      {globalAudio.questionPopSound && (
        <Sequence from={0}>
          <Audio src={resolveAudio(globalAudio.questionPopSound)!} />
        </Sequence>
      )}
      {globalAudio.countdownSound && (
        <Sequence from={countdownStartFrame} durationInFrames={question.countdownDuration}>
          <Audio src={resolveAudio(globalAudio.countdownSound)!} />
        </Sequence>
      )}
      {globalAudio.answerRevealSound && (
        <Sequence from={revealStartFrame}>
          <Audio src={resolveAudio(globalAudio.answerRevealSound)!} />
        </Sequence>
      )}
      {question.voice && (
        <Sequence from={0}>
          <Audio src={resolveAudio(question.voice)!} />
        </Sequence>
      )}
      {question.answerVoice && (
        <Sequence from={revealStartFrame}>
          <Audio src={resolveAudio(question.answerVoice)!} />
        </Sequence>
      )}
      {question.explanationVoice && (
        <Sequence from={explanationStartFrame}>
          <Audio src={resolveAudio(question.explanationVoice)!} />
        </Sequence>
      )}

      {/* 居中流式主场景容器 */}
      <div style={containerStyle}>

        {/* 内容骨架包裹层 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isLandscapeNoImage ? "flex-start" : "center",
          width: isLandscapeNoImage ? s(1300) : (isLandscape ? "100%" : "auto"),
          maxWidth: isLandscape ? "100%" : s(1550),
        }}>
          {/* 全局位于页面相对靠顶端的问题标题 */}
          {QuestionTitleBlock}

          {/* 图片与选项排版区 */}
          <div style={{
            display: "flex",
            flexDirection: isLandscape ? "row" : "column",
            width: isLandscape ? "100%" : "auto", // 竖屏下宽度由子级(选项)撑开
            gap: isLandscape ? s(80) : s(60),
            justifyContent: isLandscapeNoImage ? "flex-start" : "center",
            alignItems: isLandscape ? "stretch" : "center",
            marginTop: isLandscapeNoImage ? s(40) : 0,
          }}>
            {/* 图片块 */}
            {question.image && imageSrc && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: isLandscape ? 1 : "none",
                width: isLandscape ? "auto" : "68%", // 竖屏下占包裹层宽度的 68%
                position: isLandscape ? "relative" : "relative",
                minHeight: isLandscape ? 0 : "auto",
              }}>
                {isLandscape ? (
                  /* 横屏：填满高度但不截断，边框锁定在图片实际内容上 */
                  <Img
                    src={imageSrc}
                    style={{
                      height: "100%",
                      width: "auto", // 宽度随比例缩放，不截断也不变形
                      objectFit: "contain",
                      borderRadius: "16px",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                      border: `1px solid rgba(255,255,255,0.1)`,
                    }}
                  />
                ) : (
                  /* 竖屏：强制撑满 100% 宽度匹配选项，高度自适应杜绝变形 */
                  <Img
                    src={imageSrc}
                    style={{
                      width: "100%",
                      height: "auto", // 关键：高度跟随比例自适应，不产生透明框或变形
                      borderRadius: "16px",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                      border: `1px solid rgba(255,255,255,0.1)`,
                    }}
                  />
                )}
              </div>
            )}

            {OptionsListBlock}
          </div>
        </div>
      </div>

      {/* Safari 打印预览态的解析层 (从底端平滑滑出的解释抽屉 Drawer) */}
      {isExplanation && question.explanation && (
        <AbsoluteFill style={{ justifyContent: "flex-end", zIndex: 20 }}>
          <div
            style={{
              width: "100%",
              height: "auto", // 根据内容动态控制高度
              minHeight: isLandscape ? "35%" : "30%", // 保持最低美感高度
              background: "rgba(0,0,0,0.7)", // 稍微加深背景以提升高级感
              backdropFilter: "blur(50px)",
              WebkitBackdropFilter: "blur(50px)",
              borderTop: `1px solid rgba(255,255,255,0.2)`,
              borderTopLeftRadius: "40px",
              borderTopRightRadius: "40px",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.9)",
              padding: isLandscape ? `${s(80)}px ${s(150)}px` : `${s(80)}px ${s(115)}px`,
              display: "flex",
              flexDirection: "column",
              gap: s(40),
              fontFamily: `${theme.fontFamily}, "Noto Sans SC", sans-serif`,
              color: theme.textColor,
              transform: `translateY(${interpolate(explanationSpring, [0, 1], [100, 0])}%)`,
              opacity: transitionOutOpacity,
            }}
          >
            {/* 抽屉扶手小条装饰 */}
            <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "3px", alignSelf: "center", marginBottom: s(20) }} />
            <div style={{
              fontSize: isLandscape ? s(66) : s(66), // 略微缩小字号提升精致感
              lineHeight: 1.7, // 增加行高，中英文混排更舒展
              opacity: 0.95,
              overflowY: "visible", // 去掉滑块，内容自动撑开
              paddingBottom: s(80) // 底部留白防挤压
            }}>
              <Markdown
                options={{
                  overrides: {
                    h1: { component: "h1", props: { style: { fontSize: "1.4em", fontWeight: 800, margin: "1.2em 0 0.6em", color: theme.secondaryColor } } },
                    h2: { component: "h2", props: { style: { fontSize: "1.25em", fontWeight: 700, margin: "1.1em 0 0.5em", color: theme.secondaryColor } } },
                    h3: { component: "h3", props: { style: { fontSize: "1.15em", fontWeight: 700, margin: "1em 0 0.4em" } } },
                    p: { component: "p", props: { style: { margin: "0.8em 0" } } },
                    ul: { component: "ul", props: { style: { paddingLeft: "1.2em", margin: "0.6em 0" } } },
                    ol: { component: "ol", props: { style: { paddingLeft: "1.2em", margin: "0.6em 0" } } },
                    li: { component: "li", props: { style: { margin: "0.4em 0" } } },
                    hr: { component: "hr", props: { style: { border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5em 0" } } },
                    strong: { component: "strong", props: { style: { fontWeight: 800, color: theme.primaryColor } } },
                    code: {
                      component: "code",
                      props: {
                        style: {
                          backgroundColor: "rgba(255, 255, 255, 0.15)",
                          padding: "0.2em 0.4em",
                          borderRadius: "6px",
                          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                          fontSize: "0.9em",
                        },
                      },
                    },
                  },
                }}
              >
                {question.explanation}
              </Markdown>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
