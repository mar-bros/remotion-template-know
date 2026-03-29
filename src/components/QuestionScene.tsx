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

  // Determine Timeline phases
  const countdownStartFrame = question.enterDuration;
  const revealStartFrame = countdownStartFrame + question.countdownDuration;
  const explanationStartFrame = revealStartFrame + question.revealDuration;

  const isCountingDown = frame >= countdownStartFrame && frame < revealStartFrame;
  const isRevealed = frame >= revealStartFrame;
  const isExplanation = frame >= explanationStartFrame;

  // -- Animations --
  
  // Enter transition opacity & scale
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  // Fade out during transition (if we are the outgoing question)
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

  // Layout Styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isLandscape ? "row" : "column",
    width: "100%",
    height: "100%",
    padding: "4% 8%",
    boxSizing: "border-box",
    alignItems: "center",
    justifyContent: "center",
    gap: "5%",
    opacity: transitionOutOpacity,
    fontFamily: theme.fontFamily,
    color: theme.textColor,
    zIndex: 10,
    transform: `scale(${interpolate(enterProgress, [0, 1], [0.95, 1])})`,
  };

  const textPanelStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  };

  const imagePanelStyle: React.CSSProperties = {
    flex: question.image ? 1 : 0,
    display: question.image ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: isLandscape ? "100%" : "40%",
  };

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

      <div style={containerStyle}>
        
        {/* Question Text Panel */}
        <div style={textPanelStyle}>
          <h1
            style={{
              fontSize: isLandscape ? "4vw" : "6vw",
              fontWeight: "bold",
              marginBottom: "4vh",
              lineHeight: 1.2,
              textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            {question.question}
          </h1>

          {/* Options List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            {question.options.map((opt, i) => {
              const staggerFrames = 5 * i;
              const optionEnter = spring({
                frame: frame - staggerFrames,
                fps,
                config: { damping: 14 },
              });

              // Reveal Colors
              let bgColor = "rgba(255,255,255,0.1)";
              let outline = `2px solid ${theme.primaryColor}`;
              let opacity = 1;

              if (isRevealed) {
                if (opt.isCorrect) {
                  bgColor = theme.correctColor;
                  outline = `2px solid ${theme.correctColor}`;
                } else {
                  bgColor = "rgba(255,255,255,0.05)";
                  outline = `2px solid transparent`;
                  opacity = 0.5;
                }
              }

              return (
                <div
                  key={opt.id}
                  style={{
                    padding: "2vh 3vh",
                    borderRadius: "16px",
                    background: bgColor,
                    border: outline,
                    fontSize: isLandscape ? "2vw" : "4vw",
                    fontWeight: 500,
                    opacity: optionEnter * opacity,
                    transform: `translateY(${interpolate(optionEnter, [0, 1], [20, 0])}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: "2vh",
                    boxShadow: isRevealed && opt.isCorrect ? `0 0 30px ${theme.correctColor}88` : "none",
                    transition: "all 0.4s ease",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: theme.primaryColor }}>
                    {opt.id}.
                  </span>
                  <span>{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* Explanation Text */}
          {isExplanation && question.explanation && (
            <div
              style={{
                marginTop: "4vh",
                padding: "3vh",
                background: "rgba(0,0,0,0.4)",
                borderRadius: "16px",
                borderLeft: `6px solid ${theme.secondaryColor}`,
                fontSize: isLandscape ? "1.8vw" : "3.5vw",
                opacity: spring({
                  frame: frame - explanationStartFrame,
                  fps,
                }),
              }}
            >
              {question.explanation}
            </div>
          )}
        </div>

        {/* Media / Timer Panel */}
        <div style={imagePanelStyle}>
           {question.image ? (
             <Img
               src={question.image}
               style={{
                 maxWidth: "100%",
                 maxHeight: "100%",
                 borderRadius: "24px",
                 boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                 border: `4px solid ${theme.secondaryColor}`
               }}
             />
           ) : null}
        </div>

      </div>

      {/* Countdown Timer overlay (top right) */}
      {isCountingDown && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            right: "5%",
            width: "12vh",
            height: "12vh",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: `4px solid ${theme.primaryColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "6vh",
            fontWeight: "bold",
            color: theme.primaryColor,
            fontFamily: theme.fontFamily,
          }}
        >
          {Math.ceil(
            (question.countdownDuration - (frame - countdownStartFrame)) / fps
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
