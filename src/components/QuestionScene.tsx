import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
  staticFile
} from "remotion";
import type { ThemeSchema } from "../types/config";
import { z } from "zod";
import type { ResolvedQuestion } from "../utils/timing";

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
  const { fps, width, height } = useVideoConfig();

  // 判断是否为横屏比例 (Landscape: width > height)
  const isLandscape = width > height;

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
    padding: isLandscape ? "5% 8%" : "8% 6%", // 控制主页面和边缘的安全边界
    boxSizing: "border-box",
    alignItems: "center", // 重置为整体居中
    justifyContent: "center",
    gap: isLandscape ? "4vh" : "3vh", // 给标题区块和下方内容提供呼吸感
    opacity: transitionOutOpacity * enterProgress,
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    zIndex: 10,
    transform: `scale(${containerScale})`, // 取消初始的向上滑动动效(translateY)以免造成视觉未对齐的迟钝感
    filter: `brightness(${containerDim}) blur(${containerBlur}px)`,
    transition: "transform 0.1s linear, filter 0.1s linear",
  };

  // 毛玻璃卡片的基础样式 (仅包裹内部需要的核心元素，不再无脑拉伸变大)
  const glassStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
    borderRadius: "24px",
    padding: isLandscape ? "3vh 2.5vw" : "3.5vh 5vw", // 微调了竖屏的上下内边距，使其视觉更加均匀
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
    <div style={{ display: "flex", alignItems: isLandscapeNoImage ? "center" : "center", gap: "3vh", flexDirection: isLandscape ? "row" : "column", width: "100%", marginBottom: "50px" }}>
      {/* 倒计时 */}
      {question.countdownSeconds > 0 && (
        <div style={{ position: "relative", width: timerRadius * 2.2, height: timerRadius * 2.2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={timerRadius * 2.2} height={timerRadius * 2.2} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx={timerRadius * 1.1} cy={timerRadius * 1.1} r={timerRadius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle cx={timerRadius * 1.1} cy={timerRadius * 1.1} r={timerRadius} stroke={theme.primaryColor} strokeWidth="6" fill="none"
              strokeDasharray={timerCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "3vh", fontWeight: "bold", fontFamily: theme.fontFamily }}>
            {isRevealed ? "0" : Math.max(0, Math.ceil((question.countdownDuration - (frame - countdownStartFrame)) / fps))}
          </span>
        </div>
      )}
      
      {/* 题目正文 (动态尺寸防爆屏) */}
      <h1
        style={{
          fontSize: isLandscape ? "4.5vh" : "4.0vh",
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

  // 2. 环境图片区块 (完全拆离由于横竖屏造成的 Flex 和 Position 高度坍塌冲突)
  const QuestionImageBlock = question.image && imageSrc ? (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      flex: isLandscape ? "0 1 auto" : "none", // 横屏允许随内容自适应调整比例，且不被强制伸缩
      width: isLandscape ? "auto" : "100%",
      position: "relative",
      marginTop: isLandscape ? 0 : "3vh", // 竖屏留白
    }}>
      {isLandscape ? (
        /* 横屏：恢复自然原图比例约束，避免 cover 强行截断造成误导 */
        <Img
          src={imageSrc}
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "60vw", // 遇到惊人的宽图最多占用60vw空间
            maxHeight: "55vh", // 遇到高瘦图最多占用55vh空间，把剩余宽度释放给选项
            objectFit: "contain", // 绝对禁止剪裁
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            border: `1px solid rgba(255,255,255,0.1)`,
          }}
        />
      ) : (
        /* 竖屏：标准的响应式大图块，乖乖插入到上下之间，不产生任何浮空重叠危机 */
        <Img
          src={imageSrc}
          style={{
            maxWidth: "100%",
            maxHeight: "28vh", // 防止巨幅长图撑塌竖向排版
            objectFit: "contain",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            border: `1px solid rgba(255,255,255,0.1)`,
          }}
        />
      )}
    </div>
  ) : null;

  // 3. 选项列表卡片区块 (被精简大小的毛玻璃包裹层)
  const OptionsListBlock = (
    <div style={{ 
      ...(isLandscape ? glassStyle : {}), // 根据最新反馈，竖屏模式下直接剔除外层共用背景框，使设计更轻量
      display: "flex", 
      flexDirection: "column", 
      gap: "2vh", 
      // 使选项框"紧贴内容"，竖屏修复左右边缘空隙过大的问题
      flex: isLandscape && question.image ? "1 1 auto" : "none", // 横屏有图时占用图片剩下的剩余空间
      width: isLandscapeNoImage ? "100%" : "auto", // 除了横屏没图片强制霸占整栏，其余全部自然收缩包裹文字或者利用flex拉伸
      alignSelf: isLandscapeNoImage ? "flex-start" : "center",
      maxWidth: isLandscapeNoImage ? "none" : (isLandscape ? "60vw" : "85vw") // 防长串文本溢出的安全屏障
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
        let outline = `1px solid rgba(255,255,255,0.1)`;
        let opacity = 1;
        let badgeBg = `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)`;

        if (isRevealed) {
          if (opt.isCorrect) {
            bgColor = `${theme.correctColor}33`; // 答对选项绿光背景
            outline = `2px solid ${theme.correctColor}`;
            badgeBg = theme.correctColor;
          } else {
            bgColor = "rgba(0,0,0,0.1)"; // 错误选项退场暗化
            outline = `1px solid transparent`;
            opacity = 0.3; 
          }
        }

        return (
          <div
            key={opt.id}
            style={{
              padding: isLandscape ? "1.8vh 2vw" : "2.5vh 3.5vw", // 微调竖屏选项内边距比例，修复压迫感
              borderRadius: "16px",
              background: bgColor,
              border: outline,
              fontSize: isLandscape ? "2.6vh" : "2.8vh",
              fontWeight: 600,
              opacity: optionEnter * opacity,
              display: "flex",
              alignItems: "center",
              gap: "2vh",
              boxShadow: isRevealed && opt.isCorrect ? `0 0 30px ${theme.correctColor}55` : "none",
              // 关键修复：CSS Transition 不能应用在所有属性上(all)，否则会与 Remotion 逐帧计算的 opacity/transform 发生打架，导致明显拖影和延迟错位。只过渡颜色和阴影！
              transition: "background 0.3s ease, box-shadow 0.3s ease, border 0.3s ease, color 0.3s ease", 
            }}
          >
            {/* 左侧的 A/B/C 悬浮圆球设计 */}
            <div style={{
              minWidth: "5.5vh",
              height: "5.5vh",
              borderRadius: "50%",
              background: badgeBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: isRevealed && opt.isCorrect ? "#FFF" : theme.primaryColor,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.5s ease",
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

  return (
    <AbsoluteFill>
      
      {/* 声音触发层: 分解了不同时刻的人声与背景提示特效音 */}
      {globalAudio.questionPopSound && frame === 0 && <Audio src={globalAudio.questionPopSound} />}
      {globalAudio.countdownSound && isCountingDown && frame === countdownStartFrame && <Audio src={globalAudio.countdownSound} />}
      {globalAudio.answerRevealSound && frame === revealStartFrame && <Audio src={globalAudio.answerRevealSound} />}
      {question.voice && <Audio src={question.voice} />}
      {question.answerVoice && frame === revealStartFrame && <Audio src={question.answerVoice} />}
      {question.explanationVoice && isExplanation && frame === explanationStartFrame && <Audio src={question.explanationVoice} />}

      {/* 居中流式主场景容器 */}
      <div style={containerStyle}>
        
        {/* 增加一个逻辑内包裹层：用于无图横屏时的绝对居中包裹 + 内部左对齐 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: isLandscapeNoImage ? "flex-start" : "center",
          width: isLandscapeNoImage ? "70vw" : "100%", // 无图片时将内容束在70vw，保证外层居中时文字和选项切齐左边缘
        }}>
          {/* 全局位于页面相对靠顶端的问题标题 */}
          {QuestionTitleBlock}
          
          {/* 图片与选项排版区，自动识别原图宽高进行流式对称或上下叠放 */}
          <div style={{
            display: "flex",
            flexDirection: isLandscape ? "row" : "column",
            width: "100%",
            gap: isLandscape ? "4vw" : "3vh",
            justifyContent: isLandscapeNoImage ? "flex-start" : "center",
            alignItems: isLandscapeNoImage ? "flex-start" : "center", // 回退 stretch 拉伸对齐，采用 center 等待内容互博撑开
            marginTop: isLandscapeNoImage ? "2vh" : 0, // 无图片时让大横排间距与纵排自然区隔
          }}>
            {QuestionImageBlock}
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
              height: isLandscape ? "45%" : "40%", // 大屏或小屏时控制解析区的高度占用
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              borderTop: `1px solid rgba(255,255,255,0.15)`,
              borderTopLeftRadius: "32px",
              borderTopRightRadius: "32px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.8)",
              padding: "5vh 8vw",
              display: "flex",
              flexDirection: "column",
              gap: "2vh",
              fontFamily: theme.fontFamily,
              color: theme.textColor,
              transform: `translateY(${interpolate(explanationSpring, [0, 1], [100, 0])}%)`,
              opacity: transitionOutOpacity, 
            }}
          >
            {/* 抽屉扶手小条装饰 */}
            <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "3px", alignSelf: "center", marginBottom: "1vh" }} />
            <h2 style={{ fontSize: "3vh", margin: 0, color: theme.secondaryColor }}>解析 Explanation</h2>
            <div style={{
               fontSize: isLandscape ? "2.5vh" : "2.6vh",
               lineHeight: 1.6,
               opacity: 0.9,
               overflowY: "auto", 
               paddingBottom: "2vh"
            }}>
              {question.explanation}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
