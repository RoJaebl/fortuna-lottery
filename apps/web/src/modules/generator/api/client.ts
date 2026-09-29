import type { GeneratorGenerateRequest, GeneratorGenerateResponse } from "@fortuna-lottery/contract/generator";
import { apiPost } from "@/shared/lib/fetcher";
import { assembleGeneratedCombination } from "../transport/assembler/generate-response.assembler";
import type { GeneratedCombinationModel } from "../model/generator.model";

export async function postGenerate(request: GeneratorGenerateRequest): Promise<GeneratedCombinationModel> {
  return assembleGeneratedCombination(await apiPost<GeneratorGenerateResponse>("/api/generator", request));
}
