import { GeneratedCombinationModel } from "./GeneratedCombination.model";

/** 표시 모델 — 아직 파생값이 없지만 원형과 존재 이유가 달라 따로 둔다(model-vocabulary 규칙 2절) */
export class GeneratedCombinationViewModel extends GeneratedCombinationModel {
  static from(m: GeneratedCombinationModel): GeneratedCombinationViewModel {
    return Object.assign(new GeneratedCombinationViewModel(), m);
  }
}
