import { Module } from "@nestjs/common";
import { BacktestCombination } from "./business/BacktestCombination.js";
import { SimulationController } from "./interface/api/SimulationController.js";
import { SimulationFacade } from "./interface/facade/SimulationFacade.js";

// DRAW_HISTORY 는 여기서 묶지 않는다 — 남의 기능이라 조립 루트가 lotterietus 의 facade 를 꽂는다
@Module({
  controllers: [SimulationController],
  providers: [SimulationFacade, BacktestCombination],
  exports: [SimulationFacade],
})
export class SimulationModule {}
