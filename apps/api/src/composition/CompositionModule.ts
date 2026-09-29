import { Global, Module, type Type } from "@nestjs/common";
import { CONFIG, loadConfig } from "../config.js";
import { GeneratorModule } from "../modules/generator/GeneratorModule.js";
import { IdentityModule } from "../modules/identity/IdentityModule.js";
import { IdentityFacade } from "../modules/identity/interface/facade/IdentityFacade.js";
import { LotterietusFacade } from "../modules/lotterietus/interface/facade/LotterietusFacade.js";
import { LotterietusModule } from "../modules/lotterietus/LotterietusModule.js";
import {
  CURRENT_USER as PICKS_CURRENT_USER,
  type CurrentUserPort as PicksCurrentUserPort,
} from "../modules/picks/domain/port/CurrentUserPort.js";
import { PicksFacade } from "../modules/picks/interface/facade/PicksFacade.js";
import { PicksModule } from "../modules/picks/PicksModule.js";
import {
  CURRENT_USER as RESULTS_CURRENT_USER,
  type CurrentUserPort as ResultsCurrentUserPort,
} from "../modules/results/domain/port/CurrentUserPort.js";
import {
  DRAW_HISTORY as RESULTS_DRAW_HISTORY,
  type DrawHistoryPort as ResultsDrawHistoryPort,
} from "../modules/results/domain/port/DrawHistoryPort.js";
import { PICK_SOURCE, type PickSourcePort } from "../modules/results/domain/port/PickSourcePort.js";
import { ResultsModule } from "../modules/results/ResultsModule.js";
import {
  DRAW_HISTORY as SIMULATION_DRAW_HISTORY,
  type DrawHistoryPort as SimulationDrawHistoryPort,
} from "../modules/simulation/domain/port/DrawHistoryPort.js";
import { SimulationModule } from "../modules/simulation/SimulationModule.js";
import {
  DRAW_HISTORY as STATISTICS_DRAW_HISTORY,
  type DrawHistoryPort as StatisticsDrawHistoryPort,
} from "../modules/statistics/domain/port/DrawHistoryPort.js";
import { StatisticsModule } from "../modules/statistics/StatisticsModule.js";

/**
 * 조립 루트 — 서비스에 하나. 포트에 facade 를 꽂는 유일한 자리다(backend-module-layout 규칙 7절).
 * 모듈 등록도 여기서 한다 — app.module 은 조립 루트만 import 한다.
 */
@Global()
@Module({
  imports: [
    IdentityModule,
    GeneratorModule,
    PicksModule,
    LotterietusModule,
    StatisticsModule,
    SimulationModule,
    ResultsModule,
  ],
  providers: [
    // 설정은 여기서 한 번 읽어 전역으로 내준다 — 모듈이 CONFIG 를 다시 선언하지 않는다
    { provide: CONFIG, useFactory: loadConfig },
    // picks 와 results 가 필요로 하는 「현재 사용자」는 identity 가 준다 — 포트는 모듈마다 따로다
    { provide: PICKS_CURRENT_USER, useExisting: IdentityFacade satisfies Type<PicksCurrentUserPort> },
    { provide: RESULTS_CURRENT_USER, useExisting: IdentityFacade satisfies Type<ResultsCurrentUserPort> },
    // statistics·simulation·results 가 필요로 하는 과거 회차는 lotterietus 가 준다 — 포트는 모듈마다 따로다
    { provide: STATISTICS_DRAW_HISTORY, useExisting: LotterietusFacade satisfies Type<StatisticsDrawHistoryPort> },
    { provide: SIMULATION_DRAW_HISTORY, useExisting: LotterietusFacade satisfies Type<SimulationDrawHistoryPort> },
    { provide: RESULTS_DRAW_HISTORY, useExisting: LotterietusFacade satisfies Type<ResultsDrawHistoryPort> },
    // results 가 대조할 픽은 picks 가 준다 — 저장한 바로 그 저장소를 읽는다
    { provide: PICK_SOURCE, useExisting: PicksFacade satisfies Type<PickSourcePort> },
  ],
  exports: [
    CONFIG,
    PICKS_CURRENT_USER,
    RESULTS_CURRENT_USER,
    STATISTICS_DRAW_HISTORY,
    SIMULATION_DRAW_HISTORY,
    RESULTS_DRAW_HISTORY,
    PICK_SOURCE,
  ],
})
export class CompositionModule {}
