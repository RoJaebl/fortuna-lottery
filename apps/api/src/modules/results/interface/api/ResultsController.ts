import { Controller, Get, Inject } from "@nestjs/common";
import { ResultsCheckResponseSchema } from "@fortuna-lottery/contract/results";
import { ResultsFacade } from "../facade/ResultsFacade.js";

@Controller("results")
export class ResultsController {
  constructor(@Inject(ResultsFacade) private readonly results: ResultsFacade) {}

  @Get()
  async check() {
    return ResultsCheckResponseSchema.parse(await this.results.check()); // 틀리면 500 — 서버 결함
  }
}
