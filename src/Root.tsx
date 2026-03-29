import "./index.css";
import React from "react";
import { getInputProps, Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { KnowConfigSchema, type KnowConfig } from "./types/config";
import { buildTimeline, getTotalFrames } from "./utils/timing";
import { KnowVideo } from "./compositions/KnowVideo";
import exampleData from "./data/example.json";

export type KnowVideoProps = KnowConfig & { 
  audioDurations: Record<string, number>;
  resolvedTimeline: ReturnType<typeof buildTimeline>;
};

const calculateMetadata: CalculateMetadataFunction<KnowVideoProps> = async ({
  props,
}) => {
  // Read props override via --props OR default props
  const inputProps = getInputProps();
  const config = KnowConfigSchema.parse({ ...props, ...inputProps });

  // Collect all audio srcs that need duration lookup
  const audioSrcs: string[] = [];
  if (config.globalAudio.bgMusic) audioSrcs.push(config.globalAudio.bgMusic);
  
  config.questions.forEach(q => {
    if (q.voice) audioSrcs.push(q.voice);
    if (q.explanationVoice) audioSrcs.push(q.explanationVoice);
  });

  const uniqueAudioSrcs = [...new Set(audioSrcs)];

  let getAudioDurationInSeconds: (src: string) => Promise<number>;
  try {
    const mediaUtils = await import("@remotion/media-utils");
    getAudioDurationInSeconds = mediaUtils.getAudioDurationInSeconds;
  } catch (err) {
    console.error("Could not load @remotion/media-utils, fallback to mock durations");
    getAudioDurationInSeconds = async () => 3;
  }

  // Fetch durations in parallel
  const durations = await Promise.all(
    uniqueAudioSrcs.map(async (src) => {
      try {
        const dur = await getAudioDurationInSeconds(src);
        return [src, dur] as const;
      } catch {
        console.warn(`[KnowVideo] Could not read audio duration for: ${src}`);
        return [src, 3] as const;
      }
    })
  );

  const audioDurations = Object.fromEntries(durations);

  const resolvedTimeline = buildTimeline(config.questions, audioDurations, config.meta.fps);
  const totalFrames = Math.max(
    getTotalFrames(resolvedTimeline, config.endCredits.duration, config.meta.fps),
    1
  );

  return {
    durationInFrames: totalFrames,
    fps: config.meta.fps,
    width: config.meta.width,
    height: config.meta.height,
    props: {
      ...config,
      audioDurations,
      resolvedTimeline,
    } as KnowVideoProps,
  };
};

const defaultProps: KnowVideoProps = {
  ...(KnowConfigSchema.parse(exampleData)),
  audioDurations: {},
  resolvedTimeline: [], 
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Composition
        id="KnowVideo"
        component={KnowVideo as any}
        durationInFrames={300} // Overridden by calculateMetadata
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as any}
        calculateMetadata={calculateMetadata as any}
      />
    </>
  );
};
