import type { ResultsCheckItemModel } from "./ResultsCheckItem.model";
import type { ResultsDrawModel } from "./ResultsDraw.model";

/** 도메인 원형 — 당첨 대조 결과 (기준 회차 + 픽별 채점) */
export class ResultsCheckModel {
  draw!: ResultsDrawModel | null;
  items!: ResultsCheckItemModel[];
}
