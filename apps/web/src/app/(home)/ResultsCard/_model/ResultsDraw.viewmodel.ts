import { ResultsDrawModel } from "./ResultsDraw.model";

/** 표시 모델 — 기준 회차 하나만 보고 정해지는 당첨 공 목록을 갖는다(model-vocabulary 규칙 4절) */
export class ResultsDrawViewModel extends ResultsDrawModel {
  /** 당첨 공 — 본 번호 여섯 개 뒤에 보너스 하나 */
  get balls(): { n: number; bonus: boolean }[] {
    return [...this.numbers.map((n) => ({ n, bonus: false })), { n: this.bonus, bonus: true }];
  }

  static from(m: ResultsDrawModel): ResultsDrawViewModel {
    return Object.assign(new ResultsDrawViewModel(), m);
  }
}
