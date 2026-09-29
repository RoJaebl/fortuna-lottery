/** 백테스트 결과 — 과거 회차 채점의 비영속 파생 데이터(옛 BacktestReadModel) */
export interface Backtest {
  readonly totalDraws: number;
  /** index = 등수 (0 = 낙첨, 1~5 = 등수별 횟수) */
  readonly rankCounts: readonly number[];
  /** 당첨(5등 이상) 회차 목록 — 회차 오름차순 */
  readonly wins: readonly { round: number; rank: number; matchedCount: number }[];
}
