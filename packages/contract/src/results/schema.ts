import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";
import { LotterietusDrawSchema } from "../lotterietus/schema.js";

export const ResultsCheckItemSchema = z.object({
  pickId: z.string(),
  numbers: combinationSchema,
  matchedNumbers: z.array(z.number()),
  matchedCount: z.number(),
  bonusMatched: z.boolean(),
  /** 0 = 낙첨, 1~5 = 등수 */
  rank: z.number(),
});
export type ResultsCheckItem = z.infer<typeof ResultsCheckItemSchema>;

/** 당첨 대조 응답 — 대조 기준 회차 + 픽별 채점 결과 */
export const ResultsCheckResponseSchema = z.object({
  draw: LotterietusDrawSchema.nullable(),
  items: z.array(ResultsCheckItemSchema),
});
export type ResultsCheckResponse = z.infer<typeof ResultsCheckResponseSchema>;
