interface RankTally {
  readonly tickets: number;
  readonly rankCounts: readonly number[];
}

/** 가정 하나를 평가한 결과 — 가정 확률(우주 크기)·가정 적중률·백테스트. 계약 evaluate 응답과 같은 모양이다. */
export interface Evaluation {
  readonly totalCombinations: number;
  readonly assumedCombinations: number;
  readonly pool: readonly number[];
  readonly hitRate: { readonly hits: number; readonly rounds: number; readonly expectedRate: number };
  readonly backtest: { readonly assumed: RankTally; readonly random: RankTally };
}
