import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

const assumptionSchema = z.object({
  excludePastWinners: z.boolean(),
  topK: z.number().int().min(6).max(45).optional(),
});

/** rankCounts index = 등수 (0 = 낙첨), 길이 6 */
const rankTallySchema = z.object({ tickets: z.number(), rankCounts: z.array(z.number()) });

export const HypothesisEvaluateRequestSchema = assumptionSchema;

export const HypothesisEvaluateResponseSchema = z.object({
  totalCombinations: z.number(),
  assumedCombinations: z.number(),
  /** topK 가 없으면 1~45 전부 */
  pool: z.array(z.number()),
  hitRate: z.object({ hits: z.number(), rounds: z.number(), expectedRate: z.number() }),
  backtest: z.object({ assumed: rankTallySchema, random: rankTallySchema }),
});

export const HypothesisGenerateRequestSchema = assumptionSchema;

export const HypothesisGenerateResponseSchema = z.object({ numbers: combinationSchema });

export const HypothesisPopularityRequestSchema = z.object({ numbers: combinationSchema });

export const HypothesisPopularityResponseSchema = z.object({
  patterns: z.array(z.enum(["birthday", "consecutive", "arithmetic", "pastWinner"])),
});
