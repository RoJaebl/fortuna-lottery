/** FE 모델 원형 — 백테스트 결과 */
export interface BacktestModel {
  totalDraws: number;
  /** index = 등수 (0 = 낙첨) */
  rankCounts: number[];
  wins: { round: number; rank: number; matchedCount: number }[];
}
