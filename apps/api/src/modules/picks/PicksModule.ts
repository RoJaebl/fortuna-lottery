import { Module } from "@nestjs/common";
import { DeletePick } from "./business/DeletePick.js";
import { ListPicks } from "./business/ListPicks.js";
import { SavePick } from "./business/SavePick.js";
import { InMemoryPickRepository } from "./domain/adapter/InMemoryPickRepository.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { ID_GENERATOR } from "./domain/port/IdGeneratorPort.js";
import { PICK_REPOSITORY } from "./domain/port/PickRepositoryPort.js";
import { PicksController } from "./interface/api/PicksController.js";
import { PicksFacade } from "./interface/facade/PicksFacade.js";

/** 기본 ID 생성 — 런타임 의존성 없는 시각+난수 조합 (충돌 확률 무시 가능한 MVP 수준) */
const newPickId = () => `pick_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

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
    { provide: ID_GENERATOR, useValue: newPickId },
    { provide: CLOCK, useValue: () => new Date() },
  ],
  exports: [PicksFacade],
})
export class PicksModule {}
