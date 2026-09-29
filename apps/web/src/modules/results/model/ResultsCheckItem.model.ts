/** 도메인 원형 — 픽 하나의 당첨 대조 결과 */
export class ResultsCheckItemModel {
  pickId!: string;
  numbers!: number[];
  matchedNumbers!: number[];
  matchedCount!: number;
  bonusMatched!: boolean;
  /** 0 = 낙첨, 1~5 = 등수 */
  rank!: number;
}
