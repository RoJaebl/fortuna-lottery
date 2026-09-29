import { Inject, Injectable } from "@nestjs/common";
import type { GeneratorGenerateRequest, GeneratorGenerateResponse } from "@fortuna-lottery/contract/generator";
import { RequestRejected } from "../../../../infrastructure/http/RequestRejected.js";
import { GenerateCombination } from "../../business/GenerateCombination.js";

@Injectable()
export class GeneratorFacade {
  constructor(@Inject(GenerateCombination) private readonly generateCombination: GenerateCombination) {}

  async generate(request: GeneratorGenerateRequest): Promise<GeneratorGenerateResponse> {
    const result = this.generateCombination.execute(request);
    if (!result.ok) throw new RequestRejected(result.error);
    return { numbers: [...result.value] };
  }
}
