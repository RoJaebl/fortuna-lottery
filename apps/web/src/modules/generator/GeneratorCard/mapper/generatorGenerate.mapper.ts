import type {
  GeneratorGenerateRequest,
  GeneratorGenerateResponse,
} from "@fortuna-lottery/contract/generator";
import { GeneratedCombinationModel } from "../../model/GeneratedCombination.model";
import type { GeneratorMode } from "../../model/GeneratorMode.model";

/** 자동/부분/직접 모두 같은 계약으로 수렴한다 */
export function generatorGenerateRequest(
  mode: GeneratorMode,
  selected: readonly number[],
): GeneratorGenerateRequest {
  if (mode === "auto") return {};
  return { fixedNumbers: [...selected] };
}

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 검증은 서버가 했고 여기는 계약 타입을 받아 옮기기만 한다 */
export function generatorGenerateResponse(res: GeneratorGenerateResponse): GeneratedCombinationModel {
  const { numbers } = res;
  return Object.assign(new GeneratedCombinationModel(), { numbers: [...numbers] });
}
