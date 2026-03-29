import React from "react";
import { AbsoluteFill, Sequence, Audio, useVideoConfig } from "remotion";
import { KnowVideoProps } from "../Root";
import { QuestionScene } from "../components/QuestionScene";
import { BottomBar } from "../components/BottomBar";
import { EndCredits } from "../components/EndCredits";
import { Background } from "../components/Background";

export const KnowVideo: React.FC<KnowVideoProps> = ({
  theme,
  globalAudio,
  branding,
  endCredits,
  resolvedTimeline,
  audioDurations,
}) => {
  const { durationInFrames } = useVideoConfig();

  // Background Music
  const bgm = globalAudio?.bgMusic ? (
    <Audio 
      src={globalAudio.bgMusic} 
      volume={globalAudio.bgMusicVolume ?? 0.3} 
      loop 
    />
  ) : null;

  // The final total frames we need before end credits
  const creditsStartFrame =
    resolvedTimeline.length > 0
      ? resolvedTimeline[resolvedTimeline.length - 1].startFrame +
        resolvedTimeline[resolvedTimeline.length - 1].durationInFrames
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.backgroundColor }}>
      {bgm}

      <Background theme={theme} />

      <AbsoluteFill>
        {resolvedTimeline.map((q, index) => {
          // A question overlaps with the next by question.transitionDuration frames.
          return (
            <Sequence
              key={index}
              from={q.startFrame}
              durationInFrames={q.durationInFrames}
              name={`Question-${index + 1}`}
            >
              <QuestionScene
                question={q}
                theme={theme}
                globalAudio={globalAudio}
              />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* End Credits - Removed Sequence wrapper so global timeline frame subtraction works */}
      {endCredits && endCredits.items.length > 0 && creditsStartFrame < durationInFrames && (
        <EndCredits config={endCredits} startFrame={creditsStartFrame} />
      )}

      {/* Persistent Bottom Bar */}
      <BottomBar branding={branding} />
    </AbsoluteFill>
  );
};
