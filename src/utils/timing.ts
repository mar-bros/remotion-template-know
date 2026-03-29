import type { QuestionConfig } from "../types/config";

export type ResolvedQuestion = QuestionConfig & {
  startFrame: number;
  durationInFrames: number;
  enterDuration: number;
  countdownDuration: number;
  revealDuration: number;
  explanationDuration: number;
  transitionDuration: number; // Duration overlapping with the NEXT question
};

export const buildTimeline = (
  questions: QuestionConfig[],
  audioDurations: Record<string, number>,
  fps: number
): ResolvedQuestion[] => {
  let currentFrame = 0;
  const TRANSITION_FRAMES = 15; // half second transition between questions

  return questions.map((q, index) => {
    // 1. Enter state (Question & Options appear)
    // If there's a voice for the question, use its duration, otherwise default 30 frames
    let enterFrames = Math.max(30, Math.floor((q.voice ? (audioDurations[q.voice] || 1) : 0) * fps));
    
    // Minimum 1 second for reading if no voice
    if (!q.voice) {
      enterFrames = fps * 1.5;
    }

    // 2. Countdown duration
    const countdownFrames = Math.max(0, Math.floor(q.countdownSeconds * fps));

    // 3. Reveal duration
    const revealFrames = Math.max(0, Math.floor(q.answerWaitSeconds * fps));

    // 4. Explanation duration
    let explanationFrames = 0;
    if (q.explanationVoice) {
      explanationFrames = Math.floor((audioDurations[q.explanationVoice] || 2) * fps);
    } else if (q.explanation) {
      explanationFrames = fps * 3; // 3 seconds to read text manually
    }

    const durationInFrames = enterFrames + countdownFrames + revealFrames + explanationFrames;
    const isLast = index === questions.length - 1;
    const transitionDuration = isLast ? 0 : TRANSITION_FRAMES;

    const resolved = {
      ...q,
      startFrame: currentFrame,
      durationInFrames,
      enterDuration: enterFrames,
      countdownDuration: countdownFrames,
      revealDuration: revealFrames,
      explanationDuration: explanationFrames,
      transitionDuration,
    };

    // Stagger start frames by subtracting transition overlap so they crossfade
    currentFrame += durationInFrames - transitionDuration;

    return resolved;
  });
};

export const getTotalFrames = (
  resolvedQuestions: ResolvedQuestion[],
  endCreditsSeconds: number,
  fps: number
): number => {
  if (resolvedQuestions.length === 0) return 30; // Min 1 sec fallback
  
  const lastQuestion = resolvedQuestions[resolvedQuestions.length - 1];
  const creditsFrames = Math.floor(endCreditsSeconds * fps);
  
  // Total frames = end of last question + whatever credits we need
  return lastQuestion.startFrame + lastQuestion.durationInFrames + creditsFrames;
};
