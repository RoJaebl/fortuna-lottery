import { PickModel } from "./Pick.model";

/** 표시 모델 — 픽 하나만 보고 정해지는 저장 시각 표기를 갖는다(model-vocabulary 규칙 4절) */
export class PickViewModel extends PickModel {
  /** 저장 시각 표기 — YYYY.MM.DD HH:mm (로컬 시각) */
  get savedAt(): string {
    const d = this.createdAt;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  static from(m: PickModel): PickViewModel {
    return Object.assign(new PickViewModel(), m);
  }

  static fromMany(models: readonly PickModel[]): PickViewModel[] {
    return models.map(PickViewModel.from);
  }
}
