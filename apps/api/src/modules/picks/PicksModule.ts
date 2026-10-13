import { Module } from "@nestjs/common";
import { DeletePick } from "./business/DeletePick.js";
import { ListPicks } from "./business/ListPicks.js";
import { SavePick } from "./business/SavePick.js";
import { InMemoryPickRepository } from "./domain/adapter/InMemoryPickRepository.js";
import { randomPickId } from "./domain/adapter/RandomPickIdAdapter.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { ID_GENERATOR } from "./domain/port/IdGeneratorPort.js";
import { PICK_REPOSITORY } from "./domain/port/PickRepositoryPort.js";
import { PicksController } from "./interface/api/PicksController.js";
import { PicksFacade } from "./interface/facade/PicksFacade.js";

// CURRENT_USER 는 여기서 묶지 않는다 — 남의 기능이라 조립 루트가 identity 의 facade 를 꽂는다
@Module({
  controllers: [PicksController],
  providers: [
    PicksFacade,
    SavePick,
    ListPicks,
    DeletePick,
    // 저장소는 Nest 기본 싱글턴이다 — 모듈 인스턴스 하나에 하나
    { provide: PICK_REPOSITORY, useClass: InMemoryPickRepository },
    { provide: ID_GENERATOR, useValue: randomPickId },
    { provide: CLOCK, useValue: () => new Date() },
  ],
  exports: [PicksFacade],
})
export class PicksModule {}
