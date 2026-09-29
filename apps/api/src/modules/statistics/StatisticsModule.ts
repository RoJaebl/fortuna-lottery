import { Module } from "@nestjs/common";
import { GetStatistics } from "./business/GetStatistics.js";
import { StatisticsController } from "./interface/api/StatisticsController.js";
import { StatisticsFacade } from "./interface/facade/StatisticsFacade.js";

// DRAW_HISTORY 는 여기서 묶지 않는다 — 남의 기능이라 조립 루트가 lotterietus 의 facade 를 꽂는다
@Module({
  controllers: [StatisticsController],
  providers: [StatisticsFacade, GetStatistics],
  exports: [StatisticsFacade],
})
export class StatisticsModule {}
