import { ResultsCheckItemModel } from "./ResultsCheckItem.model";

/** 표시 모델 — 대조 결과 하나만 보고 정해지는 등수·근접 표기를 갖는다(model-vocabulary 규칙 4절) */
export class ResultsCheckItemViewModel extends ResultsCheckItemModel {
  /** 등수/근접 표기 (사실 그대로, 과장 없음) */
  get resultLabel(): string {
    if (this.rank >= 1) return `${this.rank}등`;
    if (this.matchedCount > 0) {
      return `${this.matchedCount}개 일치${this.bonusMatched ? " + 보너스" : ""} — 낙첨`;
    }
    return this.bonusMatched ? "보너스만 일치 — 낙첨" : "일치 없음 — 낙첨";
  }

  /** 5등 이상 당첨인가 */
  get isWin(): boolean {
    return this.rank >= 1;
  }

  /** 픽의 번호마다 당첨 번호와 일치했는가 */
  get balls(): { n: number; matched: boolean }[] {
    return this.numbers.map((n) => ({ n, matched: this.matchedNumbers.includes(n) }));
  }

  static from(m: ResultsCheckItemModel): ResultsCheckItemViewModel {
    return Object.assign(new ResultsCheckItemViewModel(), m);
  }

  static fromMany(models: readonly ResultsCheckItemModel[]): ResultsCheckItemViewModel[] {
    return models.map(ResultsCheckItemViewModel.from);
  }
}
