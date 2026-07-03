/** FE 모델 원형 — 당첨 대조 결과 */
export interface ResultItemModel {
  pickId: string;
  numbers: number[];
  matchedNumbers: number[];
  matchedCount: number;
  bonusMatched: boolean;
  rank: number;
}

export interface ResultsModel {
  draw: { round: number; numbers: number[]; bonus: number } | null;
  items: ResultItemModel[];
}
