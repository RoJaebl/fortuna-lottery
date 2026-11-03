/** 걸어 둔 가정 — 과거 1등 조합 제외, 출현 상위 K 개 풀(없으면 1~45 전부) */
export interface AssumptionModel {
  sumRange: SumRange;
  excludePastWinners: boolean;
  topK?: number;
  /** 고른 번호 — 0~5개, 언제나 싣는다 */
  fixed: number[];
  untilRound?: number;
}

export interface SumRange {
  min: number;
  max: number;
}

/** 등수별 집계 — rankCounts index = 등수 (0 = 낙첨), 길이 6 */
export interface RankTally {
  tickets: number;
  rankCounts: number[];
}

/** 도메인 원형 — 가정 하나를 평가한 결과 */
export class EvaluationModel {
  totalCombinations!: number;
  assumedCombinations!: number;
  pool!: number[];
  hitRate!: { hits: number; rounds: number; expectedRate: number };
  backtest!: { assumed: RankTally; random: RankTally };
  sumRange!: SumRange;
  sumRangeCombinations!: { total: number; excluded: number };
  theoryRate!: number;
  pastRate!: number;
  expectedHits!: number;
  denominators!: { past: number | null; theory: number };
  sumCounts!: number[];
  frequentBands!: { min: number; max: number; count: number; rate: number }[];
  maxWindowRate!: number;
  emptyBands!: SumRange[];
  numbers!: { n: number; possible: boolean; count: number }[];
}
