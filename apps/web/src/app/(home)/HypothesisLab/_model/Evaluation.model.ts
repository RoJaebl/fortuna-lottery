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

/** 실험실 입력 — 가정 하나로 옮기기 전의 모양 */
export interface AssumptionInput {
  range: SumRange;
  excludePastWinners: boolean;
  topKEnabled: boolean;
  topK: number;
  fixed: number[];
  /** null 이면 최신 회차까지 — 요청에 싣지 않는다 */
  untilRound: number | null;
}

/**
 * 입력을 가정 하나로 — K 스위치가 꺼져 있으면 topK 를, 최신 회차면 untilRound 를 싣지 않는다.
 * presenter 의 조회 args 와 재생 문(switches)이 미리 받는 args 가 같은 칸이 되도록 둘 다 이것을 쓴다
 */
export function assumptionRequest(i: AssumptionInput): AssumptionModel {
  return {
    sumRange: { min: i.range.min, max: i.range.max },
    excludePastWinners: i.excludePastWinners,
    fixed: [...i.fixed],
    ...(i.topKEnabled ? { topK: i.topK } : {}),
    ...(i.untilRound === null ? {} : { untilRound: i.untilRound }),
  };
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
