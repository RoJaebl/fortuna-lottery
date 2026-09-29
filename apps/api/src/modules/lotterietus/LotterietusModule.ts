import { Logger, Module } from "@nestjs/common";
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
import { LotterietusController } from "./interface/api/LotterietusController.js";
import { LotterietusIngestScheduler } from "./interface/api/LotterietusIngestScheduler.js";
import { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";

const ingestOptions: IngestDrawsOptions = { logger: (message) => Logger.log(message, "LotterietusIngest") };

// CONFIG 는 여기서 묶지 않는다 — 조립 루트가 전역으로 내준다
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
  ],
  exports: [LotterietusFacade],
})
export class LotterietusModule {}
