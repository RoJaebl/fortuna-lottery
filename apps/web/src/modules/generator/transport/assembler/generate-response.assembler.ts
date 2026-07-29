import type { GenerateResponse } from "@lotto-lab/core/generator/dto";
import type { GeneratedCombinationModel } from "../../model/generator.model";

export function assembleGeneratedCombination(dto: GenerateResponse): GeneratedCombinationModel {
  return { numbers: [...dto.numbers] };
}
