import { Inject, Injectable } from "@nestjs/common";
import type { LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
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

  async execute(): Promise<LotterietusStatusResponse> {
    const draws = await this.drawData.getAllDraws();
    const latest = draws[draws.length - 1];
    return {
      round: latest?.round ?? 0,
      numbers: latest ? [...latest.numbers] : [],
      bonus: latest?.bonus ?? 0,
      drawnAt: latest?.drawnAt ?? "",
      nextRound: (latest?.round ?? 0) + 1,
      nextDrawAt: nextDrawAt(this.clock()).toISOString(),
    };
  }
}
