/** FE 모델 원형 — 통계 (ViewModel은 이 인터페이스에만 의존) */
export interface StatisticsModel {
  totalDraws: number;
  latestRound: number;
  /** index 0 = 번호 1 */
  frequency: number[];
  sumDistribution: { sum: number; count: number }[];
  oddCountDist: number[];
  lowCountDist: number[];
  zoneCounts: number[];
  hotCold: { number: number; count: number; gap: number }[];
  topPairs: { a: number; b: number; count: number }[];
  recentGrid: { round: number; numbers: number[] }[];
  totalCombinations: number;
}
