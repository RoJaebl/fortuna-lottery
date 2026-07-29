import type { GenerateRequest, GenerateResponse } from "@fortuna-lottery/core/generator/dto";
import { apiPost } from "@/shared/lib/fetcher";
import { assembleGeneratedCombination } from "../transport/assembler/generate-response.assembler";
import type { GeneratedCombinationModel } from "../model/generator.model";

export async function postGenerate(request: GenerateRequest): Promise<GeneratedCombinationModel> {
  return assembleGeneratedCombination(await apiPost<GenerateResponse>("/api/generator", request));
}
