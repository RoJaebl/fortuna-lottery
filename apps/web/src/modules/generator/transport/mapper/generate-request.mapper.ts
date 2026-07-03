import type { GenerateRequest } from "@lotto-lab/core/generator/dto";
import type { GeneratorMode } from "../../model/generator.model";

/** FE 상태 → 요청 DTO (와이어 이음새) — 자동/부분/직접 모두 같은 계약으로 수렴 */
export function mapGenerateRequest(mode: GeneratorMode, selected: number[]): GenerateRequest {
  if (mode === "auto") return {};
  return { fixedNumbers: [...selected] };
}
