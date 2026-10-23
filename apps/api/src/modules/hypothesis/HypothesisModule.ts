import { Module } from "@nestjs/common";
import { CheckPopularity } from "./business/CheckPopularity.js";
import { EvaluateAssumption } from "./business/EvaluateAssumption.js";
import { GenerateAssumed } from "./business/GenerateAssumed.js";
import { RNG } from "./domain/port/RandomPort.js";
import { HypothesisController } from "./interface/api/HypothesisController.js";
import { HypothesisFacade } from "./interface/facade/HypothesisFacade.js";

// DRAW_HISTORY 는 여기서 묶지 않는다 — 남의 기능이라 조립 루트가 lotterietus 의 facade 를 꽂는다
@Module({
  controllers: [HypothesisController],
  providers: [HypothesisFacade, EvaluateAssumption, GenerateAssumed, CheckPopularity, { provide: RNG, useValue: Math.random }],
  exports: [HypothesisFacade],
})
export class HypothesisModule {}
