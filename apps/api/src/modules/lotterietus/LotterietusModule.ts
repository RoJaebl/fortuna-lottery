import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/PrismaModule.js";
import { GetLotterietusStatus } from "./business/GetLotterietusStatus.js";
import { GetNextDrawAt } from "./business/GetNextDrawAt.js";
import { IngestDraws } from "./business/IngestDraws.js";
import { ListDraws } from "./business/ListDraws.js";
import { DhlotteryDrawSourceAdapter } from "./domain/adapter/DhlotteryDrawSourceAdapter.js";
import { nestIngestLogger } from "./domain/adapter/NestLoggerAdapter.js";
import { PrismaDrawDataAdapter } from "./domain/adapter/PrismaDrawDataAdapter.js";
import { PrismaDrawWriterAdapter } from "./domain/adapter/PrismaDrawWriterAdapter.js";
import { timerSleep } from "./domain/adapter/TimerSleepAdapter.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { DRAW_DATA } from "./domain/port/DrawDataPort.js";
import { DRAW_SOURCE } from "./domain/port/DrawSourcePort.js";
import { DRAW_WRITER } from "./domain/port/DrawWriterPort.js";
import { LOGGER } from "./domain/port/LoggerPort.js";
import { SLEEP } from "./domain/port/SleepPort.js";
import { LotterietusController } from "./interface/api/LotterietusController.js";
import { LotterietusIngestScheduler } from "./interface/schedule/LotterietusIngestScheduler.js";
import { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";

// CONFIG 는 여기서 묶지 않는다 — 조립 루트가 전역으로 내주고, 스케줄러가 @Inject(CONFIG) 로 받는다
@Module({
  imports: [PrismaModule],
  controllers: [LotterietusController],
  providers: [
    LotterietusFacade,
    LotterietusIngestScheduler,
    GetLotterietusStatus,
    IngestDraws,
    ListDraws,
    GetNextDrawAt,
    { provide: DRAW_DATA, useClass: PrismaDrawDataAdapter },
    { provide: DRAW_WRITER, useClass: PrismaDrawWriterAdapter },
    { provide: DRAW_SOURCE, useClass: DhlotteryDrawSourceAdapter },
    { provide: LOGGER, useValue: nestIngestLogger },
    { provide: SLEEP, useValue: timerSleep },
    { provide: CLOCK, useValue: () => new Date() },
  ],
  exports: [LotterietusFacade],
})
export class LotterietusModule {}
