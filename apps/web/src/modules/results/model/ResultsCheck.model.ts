import type { ResultsCheckItemModel } from "./ResultsCheckItem.model";

/** 도메인 원형 — 대조 기준 회차 */
export class ResultsDrawModel {
  round!: number;
  numbers!: number[];
  bonus!: number;
}

/** 도메인 원형 — 당첨 대조 결과 (기준 회차 + 픽별 채점) */
export class ResultsCheckModel {
  draw!: ResultsDrawModel | null;
  items!: ResultsCheckItemModel[];
}
