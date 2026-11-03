interface RankTally {
  readonly tickets: number;
  readonly rankCounts: readonly number[];
}

interface SumRange {
  readonly min: number;
  readonly max: number;
}

/** 가정 하나를 평가한 결과 — 가정 확률(우주 크기)·가정 적중률·백테스트·합계 구간 분석. 계약 evaluate 응답과 같은 모양이다. */
export interface Evaluation {
  readonly totalCombinations: number;
  readonly assumedCombinations: number;
  readonly pool: readonly number[];
  readonly hitRate: { readonly hits: number; readonly rounds: number; readonly expectedRate: number };
  readonly backtest: { readonly assumed: RankTally; readonly random: RankTally };
  readonly sumRange: SumRange;
  readonly sumRangeCombinations: { readonly total: number; readonly excluded: number };
  readonly theoryRate: number;
  readonly pastRate: number;
  readonly expectedHits: number;
  readonly denominators: { readonly past: number | null; readonly theory: number };
  readonly sumCounts: readonly number[];
  readonly frequentBands: readonly { readonly min: number; readonly max: number; readonly count: number; readonly rate: number }[];
  readonly maxWindowRate: number;
  readonly emptyBands: readonly SumRange[];
  readonly numbers: readonly { readonly n: number; readonly possible: boolean; readonly count: number }[];
}
