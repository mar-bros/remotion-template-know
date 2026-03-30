import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// meta parameter schema (全局视频视频元数据)
export const IntroSchema = z.object({
  /** 是否开启首屏介绍功能 */
  show: z.boolean().default(false),
  /** 主标题文本 */
  title: z.string().optional(),
  /** 副标题或作者/出处描述 */
  subtitle: z.string().optional(),
  /** 多行详细描述内容，按行排列 */
  description: z.array(z.string()).optional(),
  /** 背景素材类型: "image" (图), "video" (视频), "none" (使用默认视频背景风格) */
  bgType: z.enum(["image", "video", "none"]).default("none"),
  /** 背景素材路径 (本地 public 或 HTTP) */
  bgAsset: z.string().optional(),
  /** 首屏介绍的展示时长 (秒) */
  duration: z.number().min(0).default(3),
});

export const MetaSchema = z.object({
  /** 视频帧率，建议使用 30 或 60 */
  fps: z.number().int().min(1).default(30),
  /** 视频宽度，1080为竖屏，1920为横屏 */
  width: z.number().int().min(1).default(1080),
  /** 视频高度，1920为竖屏，1080为横屏 */
  height: z.number().int().min(1).default(1920),
});

// theme parameter schema (全局主题与视觉风格配置)
export const ThemeSchema = z.object({
  /** 主体颜色，用于选项符号（如 A/B/C）、倒计时的强调色 */
  primaryColor: zColor().default("#3b82f6"),
  /** 次要颜色，用于背景极光特效的混合色、解析抽屉的左侧边框 */
  secondaryColor: zColor().default("#1e40af"),
  /** 正确答案颜色，用于揭晓答案时正确选项的高亮和外发光 */
  correctColor: zColor().default("#10b981"),
  /** 错误答案颜色（预留字段，当前未强依赖），可用于自定义扩展 */
  errorColor: zColor().default("#ef4444"),
  /** 全局文字主题色，通常为白色以适配深色星空背景 */
  textColor: zColor().default("#ffffff"),
  /** 全局底色，用于纯色背景或极光背景的最底层基础色 */
  backgroundColor: zColor().default("#0f172a"),
  /** 字体类型，默认使用 Outfit，可填入任何在 Remotion 环境或 Web 安全支持的字体名 */
  fontFamily: z.string().default("Lexend"),
  /** 视频背景风格："universe" (现代极光流体深空特效), "solid" (纯色), "image" (使用自定义全局图片) */
  bgStyle: z.enum(["universe", "solid", "image"]).default("universe"),
});

// global audio config (全局默认音效与背景音乐)
export const GlobalAudioSchema = z.object({
  /** 全局背景音乐URL地址 (支持本地 public 路径或 HTTP) */
  bgMusic: z.string().optional(),
  /** 全局背景音乐音量，0.0 到 1.0 之间，默认 0.3 */
  bgMusicVolume: z.number().min(0).max(1).default(0.3),
  /** 题目弹出瞬间的音效 (如"嗖"的转场提示音) */
  questionPopSound: z.string().optional(),
  /** 倒计时阶段的钟表滴答声或紧张感音效 */
  countdownSound: z.string().optional(),
  /** 揭晓答案瞬间的"叮"等音效 */
  answerRevealSound: z.string().optional(),
});

// bottom bar branding schema (底部商标/版权条配置)
export const BrandingSchema = z.object({
  /** 是否在视频底部显示常驻的版权/Logo水印横条 */
  show: z.boolean().default(true),
  /** 商标的 Logo 图片地址，不传则回退显示为 Mar Bro 文字 */
  logo: z.string().optional(),
  /** 商标旁的版权声明文本，如 "© 2026 XXXXX" */
  copyright: z.string().optional(),
});

// 生成片尾制作人员名单单项
export const EndCreditsItemSchema = z.object({
  /** 职位或片头，如 "CREATED BY" */
  label: z.string(),
  /** 对应人员或内容的名字，如 "Mar Bro Team" */
  value: z.string(),
});

// end credits schema (视频片尾滚动/淡入字幕配置)
export const EndCreditsSchema = z.object({
  /** 片尾的总停留时长 (秒)，会累加到所有题目播放完毕之后的总视频时长里 */
  duration: z.number().min(0).default(3), // in seconds
  /** 片尾显示的名单条目数组，为空则不显示片尾 */
  items: z.array(EndCreditsItemSchema).default([]),
});

// 单个选项 Schema
export const OptionSchema = z.object({
  /** 选项序号或字母，如 "A", "B", "1", "2" */
  id: z.string(),
  /** 选项具体的文本内容 */
  text: z.string(),
  /** 此选项是否为正确答案 (true 表示揭晓时会绿色高亮) */
  isCorrect: z.boolean().default(false),
});

// 单个问答题 Schema
export const QuestionSchema = z.object({
  /** 题目的正文内容 */
  question: z.string(),
  /** 题目配图 (可选)，横屏时显示在标题下方左侧，竖屏时夹在标题与选项中间。支持 HTTP、base64 或本项目 public 路径 */
  image: z.string().optional(),
  /** 题目刚展现时，如果需要语音朗读题目，就在此填入配音音频的路径 */
  voice: z.string().optional(),
  /** 当倒计时结束、揭晓答案(变绿)的瞬间，播放的答案语音（如“正确答案是A...”）*/
  answerVoice: z.string().optional(),
  /** 仅当前题目覆盖使用的独立背景图（可选），会叠加在默认极光或纯色背景之上 */
  bgImage: z.string().optional(),
  /** 该题目包含的所有选项数组（需确保至少有一个 isCorrect 为 true 才有揭晓效果） */
  options: z.array(OptionSchema),
  /** 留给观众思考的倒计时阶段时长 (秒)，倒计时结束后触发揭晓动画 */
  countdownSeconds: z.number().min(0).default(5),
  /** 揭晓正确答案后，在屏幕上停留的缓冲时间 (秒) */
  answerWaitSeconds: z.number().min(0).default(3),
  /** (可选) 答案解析长文本文本。如果配置了，将在 answerWaitSeconds 结束后触动底部的毛玻璃“抽屉”滑动展示 */
  explanation: z.string().optional(),
  /** (可选) 答案解析展示时长 (秒)。若配置了解析，必须人工设定时长（默认 10 秒），不再根据音频时长动态计算 */
  explanationSeconds: z.number().min(0).default(10),
  /** (可选) 答案解析展示时，需要播放的详细语音解析文件的路径 */
  explanationVoice: z.string().optional(),
});

// 整个视频的根级 Config Schema
export const KnowConfigSchema = z.object({
  meta: MetaSchema.default({ fps: 30, width: 1080, height: 1920 }),
  /** 可选的首屏介绍页面配置 */
  intro: IntroSchema.default({ show: false, bgType: "none", duration: 3 }),
  theme: ThemeSchema.default({
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    correctColor: "#10b981",
    errorColor: "#ef4444",
    textColor: "#ffffff",
    backgroundColor: "#0f172a",
    fontFamily: "Lexend",
    bgStyle: "universe"
  }),
  globalAudio: GlobalAudioSchema.default({
    bgMusicVolume: 0.3
  }),
  branding: BrandingSchema.default({ show: true }),
  endCredits: EndCreditsSchema.default({ duration: 3, items: [] }),
  /** 支持无限制地放入多道问答题，系统会按顺序渲染并在它们之间计算时长无缝切换 */
  questions: z.array(QuestionSchema).min(1),
});

export type KnowConfig = z.infer<typeof KnowConfigSchema>;
export type QuestionConfig = z.infer<typeof QuestionSchema>;
