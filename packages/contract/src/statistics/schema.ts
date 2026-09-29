import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

/** 통계 응답 — 파생 통계 + 고정 확률 분모 (정직성 장치) */
export const StatisticsGetResponseSchema = z.object({
  totalDraws: z.number(),
  latestRound: z.number(),
  /** index 0 = 번호 1 */
  frequency: z.array(z.number()),
  sumDistribution: z.array(z.object({ sum: z.number(), count: z.number() })),
  /** index = 홀수 개수 0~6 */
  oddCountDist: z.array(z.number()),
  /** index = 저구간(1~22) 개수 0~6 */
  lowCountDist: z.array(z.number()),
  /** 구간(1-10·11-20·21-30·31-40·41-45)별 총 출현 */
  zoneCounts: z.array(z.number()),
  hotCold: z.array(z.object({ number: z.number(), count: z.number(), gap: z.number() })),
  topPairs: z.array(z.object({ a: z.number(), b: z.number(), count: z.number() })),
  /** 잔디밭 시각화용 최근 회차 (오름차순) */
  recentGrid: z.array(z.object({ round: z.number(), numbers: combinationSchema })),
  /** 6/45 전체 조합 수 = 8,145,060 (고정) */
  totalCombinations: z.number(),
});
export type StatisticsGetResponse = z.infer<typeof StatisticsGetResponseSchema>;
