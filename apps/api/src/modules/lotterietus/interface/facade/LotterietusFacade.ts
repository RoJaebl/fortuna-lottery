import { Inject, Injectable } from "@nestjs/common";
import type { LotterietusDraw, LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import { GetLotterietusStatus } from "../../business/GetLotterietusStatus.js";
import { IngestDraws, type IngestDrawsResult } from "../../business/IngestDraws.js";
import type { Draw } from "../../domain/model/Draw.model.js";
import { nextDrawAt } from "../../domain/model/schedule.js";
import { CLOCK, type ClockPort } from "../../domain/port/ClockPort.js";
import { DRAW_DATA, type DrawDataPort } from "../../domain/port/DrawDataPort.js";

/**
 * 모듈 밖에 한 약속. 컨트롤러·수집 스케줄러, 그리고 조립 루트가 꽂아 줄 다른 모듈(statistics·simulation·results)이 본다.
 * findAll 은 옛 DrawDataPort.getAllDraws 그대로다 — 회차 오름차순, 마지막 원소가 최신 회차.
 * 밖으로는 원형이 아니라 계약 모양(LotterietusDraw, 가변 배열)으로 내준다 — 받는 모듈의 포트가 계약 타입을 쓴다.
 */
/** 도메인 원형을 계약 모양으로 옮긴다 */
const toDraw = (draw: Draw): LotterietusDraw => ({
  round: draw.round,
  numbers: [...draw.numbers],
  bonus: draw.bonus,
  drawnAt: draw.drawnAt,
});

@Injectable()
export class LotterietusFacade {
  constructor(
    @Inject(GetLotterietusStatus) private readonly getStatus: GetLotterietusStatus,
    @Inject(IngestDraws) private readonly ingestDraws: IngestDraws,
    @Inject(DRAW_DATA) private readonly drawData: DrawDataPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
  ) {}

  status(): Promise<LotterietusStatusResponse> {
    return this.getStatus.execute();
  }

  ingest(): Promise<IngestDrawsResult> {
    return this.ingestDraws.execute();
  }

  async findAll(): Promise<LotterietusDraw[]> {
    return (await this.drawData.getAllDraws()).map(toDraw);
  }

  /** 지금 이후 가장 가까운 추첨 시각 — 수집 스케줄러가 다음 깨어날 때를 정한다 */
  nextDrawAt(): Date {
    return nextDrawAt(this.clock());
  }
}
