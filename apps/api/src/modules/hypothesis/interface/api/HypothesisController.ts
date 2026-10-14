import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import {
  HypothesisEvaluateRequestSchema,
  HypothesisEvaluateResponseSchema,
  HypothesisGenerateRequestSchema,
  HypothesisGenerateResponseSchema,
  HypothesisPopularityRequestSchema,
  HypothesisPopularityResponseSchema,
} from "@fortuna-lottery/contract/hypothesis";
import { parseRequest } from "../../../../infrastructure/http/parseRequest.js";
import { HypothesisFacade } from "../facade/HypothesisFacade.js";

// 요청이 틀리면 400(클라이언트 잘못), 응답이 계약을 어기면 500(서버 결함)
@Controller("hypothesis")
export class HypothesisController {
  constructor(@Inject(HypothesisFacade) private readonly hypothesis: HypothesisFacade) {}

  @Post("evaluate")
  @HttpCode(200)
  async evaluate(@Body() raw: unknown) {
    const request = parseRequest(HypothesisEvaluateRequestSchema, raw);
    return HypothesisEvaluateResponseSchema.parse(await this.hypothesis.evaluate(request));
  }

  @Post("generate")
  @HttpCode(200)
  async generate(@Body() raw: unknown) {
    const request = parseRequest(HypothesisGenerateRequestSchema, raw);
    return HypothesisGenerateResponseSchema.parse(await this.hypothesis.generate(request));
  }

  @Post("popularity")
  @HttpCode(200)
  async popularity(@Body() raw: unknown) {
    const request = parseRequest(HypothesisPopularityRequestSchema, raw);
    return HypothesisPopularityResponseSchema.parse(await this.hypothesis.popularity(request));
  }
}
