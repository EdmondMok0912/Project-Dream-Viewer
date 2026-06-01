import { z } from "zod";

export const dreamInputSchema = z.object({
  title: z.string().min(1, "請輸入標題"),
  date: z.string().min(1, "請選擇日期"),
  dreamContent: z.string().min(10, "夢境內容過短，請盡量詳細描述"),
  wakingEmotion: z.string().min(1, "請描述醒來後的情緒"),
  dreamEmotion: z.string().min(1, "請描述夢中的情緒"),
  keyCharacters: z.string().optional(),
  keyScenes: z.string().optional(),
  keySymbols: z.string().optional(),
  personalAssociations: z.string().min(5, "請簡述這些元素對您個人的聯想"),
  recentLifeEvents: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type DreamInput = z.infer<typeof dreamInputSchema>;

export const riskClassificationSchema = z.object({
  status: z.enum(["CLEAR", "WARNING", "ABORT"]),
  reason: z.string().optional(),
  matchedKeywords: z.array(z.string()).optional(),
});

export type RiskClassification = z.infer<typeof riskClassificationSchema>;

export const reportSchema = z.object({
  summary: z.object({
    theme: z.string(),
    coreEmotion: z.string(),
    mainSymbols: z.array(z.string()),
    briefSummary: z.string()
  }),
  detailedAnalysis: z.object({
    jungianPerspective: z.string(),
    psychodynamicCompensation: z.string(),
    realLifeConnection: z.string(),
    weeklyReflectionQuestions: z.array(z.string()),
  }),
  alternativePerspectives: z.object({
    freudianView: z.string().optional(),
    modernPsychology: z.string().optional(),
    physiologicalOrStressFactors: z.string().optional()
  }).optional()
});

export type AnalysisReport = z.infer<typeof reportSchema>;

export type ExportedDream = {
  version: "1.0";
  timestamp: string;
  input: DreamInput;
  report: AnalysisReport;
}
