import { Logger, Module } from "@nestjs/common";
import { type ApiConfig, CONFIG } from "../../config.js";
import { PrismaModule } from "../../infrastructure/prisma/PrismaModule.js";
import { GetLotterietusStatus } from "./business/GetLotterietusStatus.js";
import { INGEST_DRAWS_OPTIONS, IngestDraws, type IngestDrawsOptions } from "./business/IngestDraws.js";
import { DhlotteryDrawSourceAdapter } from "./domain/adapter/DhlotteryDrawSourceAdapter.js";
import { PrismaDrawDataAdapter } from "./domain/adapter/PrismaDrawDataAdapter.js";
import { PrismaDrawWriterAdapter } from "./domain/adapter/PrismaDrawWriterAdapter.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { DRAW_DATA } from "./domain/port/DrawDataPort.js";
import { DRAW_SOURCE } from "./domain/port/DrawSourcePort.js";
import { DRAW_WRITER } from "./domain/port/DrawWriterPort.js";
import { INGEST_ENABLED } from "./domain/port/IngestEnabledPort.js";
import { LotterietusController } from "./interface/api/LotterietusController.js";
import { LotterietusIngestScheduler } from "./interface/api/LotterietusIngestScheduler.js";
import { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";

const ingestOptions: IngestDrawsOptions = { logger: (message) => Logger.log(message, "LotterietusIngest") };

// CONFIG 는 여기서 묶지 않는다 — 조립 루트가 전역으로 내준다. 스케줄러가 설정을 모르도록 여기서 필요한 값 하나만 풀어 준다
@Module({
  imports: [PrismaModule],
  controllers: [LotterietusController],
  providers: [
    LotterietusFacade,
    LotterietusIngestScheduler,
    GetLotterietusStatus,
    IngestDraws,
    { provide: DRAW_DATA, useClass: PrismaDrawDataAdapter },
    { provide: DRAW_WRITER, useClass: PrismaDrawWriterAdapter },
    { provide: DRAW_SOURCE, useClass: DhlotteryDrawSourceAdapter },
    { provide: INGEST_DRAWS_OPTIONS, useValue: ingestOptions },
    { provide: CLOCK, useValue: () => new Date() },
    { provide: INGEST_ENABLED, inject: [CONFIG], useFactory: (config: ApiConfig) => config.schedulerEnabled },
  ],
  exports: [LotterietusFacade],
})
export class LotterietusModule {}
