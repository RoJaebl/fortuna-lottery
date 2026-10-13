/** 도메인 원형 — 전 회차 통계 */
export class StatisticsModel {
  totalDraws!: number;
  latestRound!: number;
  /** index 0 = 번호 1 */
  frequency!: number[];
  sumDistribution!: { sum: number; count: number }[];
  oddCountDist!: number[];
  lowCountDist!: number[];
  zoneCounts!: number[];
  hotCold!: { number: number; count: number; gap: number }[];
  topPairs!: { a: number; b: number; count: number }[];
  recentGrid!: { round: number; numbers: number[] }[];
  totalCombinations!: number;
}
