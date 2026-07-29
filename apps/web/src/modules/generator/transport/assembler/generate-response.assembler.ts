import type { GenerateResponse } from "@fortuna-lottery/core/generator/dto";
import type { GeneratedCombinationModel } from "../../model/generator.model";

export function assembleGeneratedCombination(dto: GenerateResponse): GeneratedCombinationModel {
  return { numbers: [...dto.numbers] };
}
