import { Module } from "@nestjs/common";
import { CheckResults } from "./business/CheckResults.js";
import { ResultsCheckContext } from "./context/ResultsCheckContext.js";
import { ResultsController } from "./interface/api/ResultsController.js";
import { ResultsFacade } from "./interface/facade/ResultsFacade.js";

// CURRENT_USER·PICK_SOURCE·DRAW_HISTORY 는 여기서 묶지 않는다 — 남의 기능이라 조립 루트가 identity·picks·lotterietus 의 facade 를 꽂는다
@Module({
  controllers: [ResultsController],
  providers: [ResultsFacade, CheckResults, ResultsCheckContext],
  exports: [ResultsFacade],
})
export class ResultsModule {}
