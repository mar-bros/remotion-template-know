import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Audio,
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

export const QuestionScene: React.FC<QuestionSceneProps> = ({
  question,
  theme,
  globalAudio,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isLandscape = width > height;

  // -- Timeline Phases --
  const countdownStartFrame = question.enterDuration;
  const revealStartFrame = countdownStartFrame + question.countdownDuration;
  const explanationStartFrame = revealStartFrame + question.revealDuration;

  const isCountingDown = frame >= countdownStartFrame && frame < revealStartFrame;
  const isRevealed = frame >= revealStartFrame;
  const isExplanation = frame >= explanationStartFrame;

  // -- Animations --
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const explanationSpring = spring({
    frame: frame - explanationStartFrame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const isTransitioningOut =
    frame > question.durationInFrames - question.transitionDuration;
  const transitionOutOpacity = isTransitioningOut
    ? interpolate(
        frame,
        [
          question.durationInFrames - question.transitionDuration,
          question.durationInFrames,
        ],
        [1, 0],
        { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
      )
    : 1;

  // Main Container scales down dynamically during explanation
  const containerScale = interpolate(explanationSpring, [0, 1], [1, 0.85]);
  const containerBlur = interpolate(explanationSpring, [0, 1], [0, 4]); // backdrop blur effect
  const containerDim = interpolate(explanationSpring, [0, 1], [1, 0.4]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isLandscape ? "row" : "column",
    width: "100%",
    height: "100%",
    padding: isLandscape ? "4% 8%" : "8% 6%",
    boxSizing: "border-box",
    alignItems: "stretch",
    justifyContent: "center",
    gap: "5%",
    opacity: transitionOutOpacity,
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    zIndex: 10,
    transform: `scale(${containerScale})`,
    filter: `brightness(${containerDim}) blur(${containerBlur}px)`,
    transition: "transform 0.1s linear, filter 0.1s linear",
  };

  // Glassmorphism block styles
  const glassStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    borderRadius: "24px",
    padding: isLandscape ? "4vh 3vw" : "3vh 5vw",
  };

  const textPanelStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const imagePanelStyle: React.CSSProperties = {
    flex: question.image ? 1 : 0,
    display: question.image ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: isLandscape ? "100%" : "30%",
  };

  // Timer Math
  const timerRadius = isLandscape ? 40 : 50;
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

  return (
    <AbsoluteFill>
      {/* Optional Custom Background for this Question */}
      {question.bgImage && (
        <Img
          src={question.bgImage}
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", opacity: 0.3 }}
        />
      )}

      {/* Audio logic */}
      {globalAudio.questionPopSound && frame === 0 && <Audio src={globalAudio.questionPopSound} />}
      {globalAudio.countdownSound && isCountingDown && frame === countdownStartFrame && (
         <Audio src={globalAudio.countdownSound} />
      )}
      {globalAudio.answerRevealSound && frame === revealStartFrame && (
         <Audio src={globalAudio.answerRevealSound} />
      )}
      {question.voice && <Audio src={question.voice} />}
      {question.explanationVoice && isExplanation && frame === explanationStartFrame && (
        <Audio src={question.explanationVoice} />
      )}

      {/* Main Scalable Content Wrapper */}
      <div style={containerStyle}>
        
        {/* Top Centered Timer & Title area */}
        <div style={{...textPanelStyle, gap: "3vh", transform: `translateY(${interpolate(enterProgress, [0, 1], [40, 0])}px)`, opacity: enterProgress}}>
          
          {/* Centered Countdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "2vh", marginBottom: "1vh" }}>
            <div style={{ position: "relative", width: timerRadius * 2.2, height: timerRadius * 2.2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={timerRadius * 2.2} height={timerRadius * 2.2} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle
                  cx={timerRadius * 1.1}
                  cy={timerRadius * 1.1}
                  r={timerRadius}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx={timerRadius * 1.1}
                  cy={timerRadius * 1.1}
                  r={timerRadius}
                  stroke={theme.primaryColor}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span style={{ fontSize: isLandscape ? "2.5vh" : "3.5vh", fontWeight: "bold", fontFamily: theme.fontFamily }}>
                {isRevealed ? "0" : Math.max(0, Math.ceil((question.countdownDuration - (frame - countdownStartFrame)) / fps))}
              </span>
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: isLandscape ? "4vh" : "5vh",
                fontWeight: 800,
                lineHeight: 1.3,
                textShadow: "0 4px 12px rgba(0,0,0,0.6)",
                margin: 0,
                flex: 1
              }}
            >
              {question.question}
            </h1>
          </div>

          {/* Options Glassmorphism Container */}
          <div style={{ ...glassStyle, display: "flex", flexDirection: "column", gap: "2vh" }}>
            {question.options.map((opt, i) => {
              const staggerFrames = 4 * i;
              const optionEnter = spring({
                frame: frame - staggerFrames,
                fps,
                config: { damping: 14 },
              });

              // Reveal Colors
              let bgColor = "rgba(255,255,255,0.03)";
              let outline = `1px solid rgba(255,255,255,0.1)`;
              let opacity = 1;
              let badgeBg = `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)`;

              if (isRevealed) {
                if (opt.isCorrect) {
                  bgColor = `${theme.correctColor}22`; // 22 is hex alpha
                  outline = `2px solid ${theme.correctColor}`;
                  badgeBg = theme.correctColor;
                } else {
                  bgColor = "rgba(0,0,0,0.1)";
                  outline = `1px solid transparent`;
                  opacity = 0.4;
                }
              }

              return (
                <div
                  key={opt.id}
                  style={{
                    padding: isLandscape ? "1.5vh 2vw" : "2vh 4vw",
                    borderRadius: "16px",
                    background: bgColor,
                    border: outline,
                    fontSize: isLandscape ? "3vh" : "3.5vh",
                    fontWeight: 600,
                    opacity: optionEnter * opacity,
                    transform: `translateY(${interpolate(optionEnter, [0, 1], [20, 0])}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: "2vh",
                    boxShadow: isRevealed && opt.isCorrect ? `0 0 30px ${theme.correctColor}66` : "none",
                    transition: "all 0.4s ease",
                  }}
                >
                  {/* Badge */}
                  <div style={{
                    minWidth: isLandscape ? "5vh" : "6vh",
                    height: isLandscape ? "5vh" : "6vh",
                    borderRadius: "50%",
                    background: badgeBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.4s ease",
                  }}>
                    {opt.id}
                  </div>
                  <span>{opt.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Panel */}
        <div style={imagePanelStyle}>
           {question.image ? (
             <Img
               src={question.image}
               style={{
                 maxWidth: "100%",
                 maxHeight: "100%",
                 borderRadius: "24px",
                 boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                 border: `1px solid rgba(255,255,255,0.1)`,
                 opacity: enterProgress,
                 transform: `scale(${interpolate(enterProgress, [0, 1], [0.9, 1])})`
               }}
             />
           ) : null}
        </div>

      </div>

      {/* Drawer-style Explanation Overlay */}
      {isExplanation && question.explanation && (
        <AbsoluteFill style={{ justifyContent: "flex-end", zIndex: 20 }}>
          <div
            style={{
              width: "100%",
              height: isLandscape ? "40%" : "45%",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(30px)",
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
              opacity: transitionOutOpacity, // fades out smoothly with the rest of the scene transition
            }}
          >
            <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "3px", alignSelf: "center", marginBottom: "1vh" }} />
            <h2 style={{ fontSize: isLandscape ? "3.5vh" : "4vh", margin: 0, color: theme.secondaryColor }}>解析 Explanation</h2>
            <div style={{
               fontSize: isLandscape ? "2.5vh" : "3vh",
               lineHeight: 1.6,
               opacity: 0.9
            }}>
              {question.explanation}
            </div>
          </div>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
