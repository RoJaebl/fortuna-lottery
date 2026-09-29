import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import {
  GeneratorGenerateRequestSchema,
  GeneratorGenerateResponseSchema,
} from "@fortuna-lottery/contract/generator";
import { parseRequest } from "../../../../infrastructure/http/parseRequest.js";
import { GeneratorFacade } from "../facade/GeneratorFacade.js";

@Controller("generator")
export class GeneratorController {
  constructor(@Inject(GeneratorFacade) private readonly generator: GeneratorFacade) {}

  @Post()
  @HttpCode(200) // 옛 Next 처리기가 200 을 냈다 — Nest 의 POST 기본값 201 로 바꾸지 않는다
  async generate(@Body() raw: unknown) {
    const request = parseRequest(GeneratorGenerateRequestSchema, raw); // 틀리면 400 — 클라이언트 잘못
    return GeneratorGenerateResponseSchema.parse(await this.generator.generate(request)); // 틀리면 500 — 서버 결함
  }
}
