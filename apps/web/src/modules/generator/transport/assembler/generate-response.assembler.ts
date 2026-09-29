import type { GeneratorGenerateResponse } from "@fortuna-lottery/contract/generator";
import type { GeneratedCombinationModel } from "../../model/generator.model";

export function assembleGeneratedCombination(dto: GeneratorGenerateResponse): GeneratedCombinationModel {
  return { numbers: [...dto.numbers] };
}
