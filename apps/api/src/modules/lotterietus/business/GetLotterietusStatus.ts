import { Inject, Injectable } from "@nestjs/common";
import type { LotterietusStatus } from "../domain/model/LotterietusStatus.model.js";
import { nextDrawAt } from "../domain/model/schedule.js";
import { CLOCK, type ClockPort } from "../domain/port/ClockPort.js";
import { DRAW_DATA, type DrawDataPort } from "../domain/port/DrawDataPort.js";

/** 로또 현황 유스케이스 — 최근 회차 + 다음 추첨 정보를 getAllDraws 한 번으로 계산한다 */
@Injectable()
export class GetLotterietusStatus {
  constructor(
    @Inject(DRAW_DATA) private readonly drawData: DrawDataPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<LotterietusStatus> {
    const draws = await this.drawData.getAllDraws();
    const latest = draws[draws.length - 1] ?? null;
    return {
      latest,
      nextRound: (latest?.round ?? 0) + 1,
      nextDrawAt: nextDrawAt(this.clock()),
    };
  }
}
