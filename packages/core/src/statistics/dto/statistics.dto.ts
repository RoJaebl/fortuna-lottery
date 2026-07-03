import type { StatisticsReadModel } from "../application/readmodel/statistics.readmodel";

/** 통계 응답 DTO — Read-Model + 고정 확률 분모 (정직성 장치) */
export interface StatisticsResponse extends StatisticsReadModel {
  /** 6/45 전체 조합 수 = 8,145,060 (고정) */
  totalCombinations: number;
}
