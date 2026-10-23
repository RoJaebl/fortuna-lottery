import { Inject, Injectable } from "@nestjs/common";
import { nextDrawAt } from "../domain/model/schedule.js";
import { CLOCK, type ClockPort } from "../domain/port/ClockPort.js";

/** 지금 이후 가장 가까운 추첨 시각 — 수집 스케줄러가 다음 깨어날 때를 정한다 */
@Injectable()
export class GetNextDrawAt {
  constructor(@Inject(CLOCK) private readonly clock: ClockPort) {}

  execute(): Date {
    return nextDrawAt(this.clock());
  }
}
