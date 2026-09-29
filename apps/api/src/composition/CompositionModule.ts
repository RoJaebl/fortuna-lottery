import { Global, Module, type Type } from "@nestjs/common";
import { CONFIG, loadConfig } from "../config.js";
import { GeneratorModule } from "../modules/generator/GeneratorModule.js";
import { IdentityModule } from "../modules/identity/IdentityModule.js";
import { IdentityFacade } from "../modules/identity/interface/facade/IdentityFacade.js";
import { LotterietusFacade } from "../modules/lotterietus/interface/facade/LotterietusFacade.js";
import { LotterietusModule } from "../modules/lotterietus/LotterietusModule.js";
import { CURRENT_USER, type CurrentUserPort } from "../modules/picks/domain/port/CurrentUserPort.js";
import { PicksModule } from "../modules/picks/PicksModule.js";
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
  imports: [IdentityModule, GeneratorModule, PicksModule, LotterietusModule, StatisticsModule, SimulationModule],
  providers: [
    // 설정은 여기서 한 번 읽어 전역으로 내준다 — 모듈이 CONFIG 를 다시 선언하지 않는다
    { provide: CONFIG, useFactory: loadConfig },
    // picks 가 필요로 하는 「현재 사용자」는 identity 가 준다
    { provide: CURRENT_USER, useExisting: IdentityFacade satisfies Type<CurrentUserPort> },
    // statistics 와 simulation 이 필요로 하는 과거 회차는 lotterietus 가 준다 — 포트는 모듈마다 따로다
    { provide: STATISTICS_DRAW_HISTORY, useExisting: LotterietusFacade satisfies Type<StatisticsDrawHistoryPort> },
    { provide: SIMULATION_DRAW_HISTORY, useExisting: LotterietusFacade satisfies Type<SimulationDrawHistoryPort> },
  ],
  exports: [CONFIG, CURRENT_USER, STATISTICS_DRAW_HISTORY, SIMULATION_DRAW_HISTORY],
})
export class CompositionModule {}
