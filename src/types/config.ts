import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// meta parameter schema
export const MetaSchema = z.object({
  fps: z.number().int().min(1).default(30),
  width: z.number().int().min(1).default(1080),
  height: z.number().int().min(1).default(1920),
});

// theme parameter schema
export const ThemeSchema = z.object({
  primaryColor: zColor().default("#3b82f6"),
  secondaryColor: zColor().default("#1e40af"),
  correctColor: zColor().default("#10b981"),
  errorColor: zColor().default("#ef4444"),
  textColor: zColor().default("#ffffff"),
  backgroundColor: zColor().default("#0f172a"),
  fontFamily: z.string().default("Outfit"),
});

// global audio config
export const GlobalAudioSchema = z.object({
  bgMusic: z.string().optional(),
  bgMusicVolume: z.number().min(0).max(1).default(0.3),
  questionPopSound: z.string().optional(),
  countdownSound: z.string().optional(),
  answerRevealSound: z.string().optional(),
});

// bottom bar branding schema
export const BrandingSchema = z.object({
  show: z.boolean().default(true),
  logo: z.string().optional(),
  copyright: z.string().optional(),
});

export const EndCreditsItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

// end credits schema
export const EndCreditsSchema = z.object({
  duration: z.number().min(0).default(3), // in seconds
  items: z.array(EndCreditsItemSchema).default([]),
});

export const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean().default(false),
});

export const QuestionSchema = z.object({
  question: z.string(),
  image: z.string().optional(),
  voice: z.string().optional(), // Question voiceover
  bgImage: z.string().optional(),
  options: z.array(OptionSchema),
  countdownSeconds: z.number().min(0).default(5),
  answerWaitSeconds: z.number().min(0).default(3),
  explanation: z.string().optional(),
  explanationVoice: z.string().optional(),
});

export const KnowConfigSchema = z.object({
  meta: MetaSchema.default({ fps: 30, width: 1080, height: 1920 }),
  theme: ThemeSchema.default({
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    correctColor: "#10b981",
    errorColor: "#ef4444",
    textColor: "#ffffff",
    backgroundColor: "#0f172a",
    fontFamily: "Outfit"
  }),
  globalAudio: GlobalAudioSchema.default({
    bgMusicVolume: 0.3
  }),
  branding: BrandingSchema.default({ show: true }),
  endCredits: EndCreditsSchema.default({ duration: 3, items: [] }),
  questions: z.array(QuestionSchema).min(1),
});

export type KnowConfig = z.infer<typeof KnowConfigSchema>;
export type QuestionConfig = z.infer<typeof QuestionSchema>;
