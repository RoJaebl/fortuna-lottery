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

/**
 * 로또 현황 응답 — 최근 회차 + 다음 추첨 정보.
 * 회차가 하나도 없으면 round 0 · numbers [] · bonus 0 · drawnAt "" 인 빈 상태로 답한다(옛 응답 모양 그대로) — 그래서 numbers 는 빈 배열도 받는다.
 */
export const LotterietusStatusResponseSchema = z.object({
  round: z.number(),
  numbers: combinationSchema.or(z.array(z.number()).length(0)),
  bonus: z.number(),
  drawnAt: z.string(),
  nextRound: z.number(),
  nextDrawAt: z.string(),
});
export type LotterietusStatusResponse = z.infer<typeof LotterietusStatusResponseSchema>;
