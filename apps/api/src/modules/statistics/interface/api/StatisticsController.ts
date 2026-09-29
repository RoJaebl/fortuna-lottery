import { Controller, Get, Inject } from "@nestjs/common";
import { StatisticsGetResponseSchema } from "@fortuna-lottery/contract/statistics";
import { StatisticsFacade } from "../facade/StatisticsFacade.js";

@Controller("statistics")
export class StatisticsController {
  constructor(@Inject(StatisticsFacade) private readonly statistics: StatisticsFacade) {}

  @Get()
  async get() {
    return StatisticsGetResponseSchema.parse(await this.statistics.get()); // 틀리면 500 — 서버 결함
  }
}
