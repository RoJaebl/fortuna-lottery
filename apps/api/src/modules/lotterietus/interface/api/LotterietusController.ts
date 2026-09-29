import { Controller, Get, Inject } from "@nestjs/common";
import { LotterietusStatusResponseSchema } from "@fortuna-lottery/contract/lotterietus";
import { LotterietusFacade } from "../facade/LotterietusFacade.js";

@Controller("lotterietus")
export class LotterietusController {
  constructor(@Inject(LotterietusFacade) private readonly lotterietus: LotterietusFacade) {}

  @Get()
  async status() {
    return LotterietusStatusResponseSchema.parse(await this.lotterietus.status()); // 틀리면 500 — 서버 결함
  }
}
