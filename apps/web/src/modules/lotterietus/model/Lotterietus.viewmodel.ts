import { LotterietusModel } from "./Lotterietus.model";

/**
 * 표시 모델 — 그 회차 하나만 보고 정해지는 추첨일 표기를 갖는다(model-vocabulary 규칙 4절).
 * 남은 시간은 지금 시각에 따라 바뀌므로 여기 두지 않고 표시 조정자가 갖는다.
 */
export class LotterietusViewModel extends LotterietusModel {
  /** 추첨일 표기 — YYYY.MM.DD (로컬 시각) */
  get drawDate(): string {
    const drawnAt = this.drawnAt;
    return `${drawnAt.getFullYear()}.${String(drawnAt.getMonth() + 1).padStart(2, "0")}.${String(drawnAt.getDate()).padStart(2, "0")}`;
  }

  static from(m: LotterietusModel): LotterietusViewModel {
    return Object.assign(new LotterietusViewModel(), m);
  }
}
