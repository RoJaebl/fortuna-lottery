import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

/** 회차 조회 응답 조각 — 와이어 계약 (results 도메인도 사용) */
export const LotterietusDrawSchema = z.object({
  round: z.number(),
  numbers: combinationSchema,
  bonus: z.number(),
  drawnAt: z.string(),
});
export type LotterietusDraw = z.infer<typeof LotterietusDrawSchema>;

/** 로또 현황 응답 — 최근 회차 + 다음 추첨 정보 */
export const LotterietusStatusResponseSchema = z.object({
  round: z.number(),
  numbers: combinationSchema,
  bonus: z.number(),
  drawnAt: z.string(),
  nextRound: z.number(),
  nextDrawAt: z.string(),
});
export type LotterietusStatusResponse = z.infer<typeof LotterietusStatusResponseSchema>;
