import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

// 합계 21 = 1+2+3+4+5+6, 255 = 40+...+45. 계약은 커널을 참조하지 않으므로 값을 적는다.
// min <= max 는 도메인 규칙이라 여기서 보지 않는다.
const sumBound = z.number().int().min(21).max(255);

const assumptionSchema = z.object({
  sumRange: z.object({ min: sumBound, max: sumBound }),
  excludePastWinners: z.boolean(),
  topK: z.number().int().min(6).max(45).optional(),
  fixed: z.array(z.number().int().min(1).max(45)).max(5).default([]),
  untilRound: z.number().int().min(1).optional(),
});

const sumRangeSchema = z.object({ min: z.number(), max: z.number() });

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
  sumRange: sumRangeSchema,
  /** total 은 제외 전(풀 안), assumedCombinations = total - excluded */
  sumRangeCombinations: z.object({ total: z.number(), excluded: z.number() }),
  theoryRate: z.number(),
  pastRate: z.number(),
  expectedHits: z.number(),
  /** past 는 과거 비율이 0 이면 null */
  denominators: z.object({ past: z.number().nullable(), theory: z.number() }),
  /** 길이 235, index 0 = 합 21 */
  sumCounts: z.array(z.number()),
  frequentBands: z.array(z.object({ min: z.number(), max: z.number(), count: z.number(), rate: z.number() })),
  maxWindowRate: z.number(),
  emptyBands: z.array(sumRangeSchema),
  /** 길이 45 */
  numbers: z.array(z.object({ n: z.number(), possible: z.boolean(), count: z.number() })),
});

export const HypothesisGenerateRequestSchema = assumptionSchema;

export const HypothesisGenerateResponseSchema = z.object({ numbers: combinationSchema });

export const HypothesisPopularityRequestSchema = z.object({ numbers: combinationSchema });

export const HypothesisPopularityResponseSchema = z.object({
  patterns: z.array(z.enum(["birthday", "consecutive", "arithmetic", "pastWinner"])),
});
