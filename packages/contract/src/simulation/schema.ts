import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

export const SimulationBacktestRequestSchema = z.object({
  numbers: combinationSchema,
});
export type SimulationBacktestRequest = z.infer<typeof SimulationBacktestRequestSchema>;

/** 백테스트 응답 — 등수별 횟수 + 당첨 회차 목록 (사실 그대로) */
export const SimulationBacktestResponseSchema = z.object({
  totalDraws: z.number(),
  /** index = 등수 (0 = 낙첨) */
  rankCounts: z.array(z.number()),
  wins: z.array(z.object({ round: z.number(), rank: z.number(), matchedCount: z.number() })),
});
export type SimulationBacktestResponse = z.infer<typeof SimulationBacktestResponseSchema>;
