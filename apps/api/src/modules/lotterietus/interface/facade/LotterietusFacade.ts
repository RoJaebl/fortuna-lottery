import { Inject, Injectable } from "@nestjs/common";
import type { LotterietusDraw, LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import { GetLotterietusStatus } from "../../business/GetLotterietusStatus.js";
import { GetNextDrawAt } from "../../business/GetNextDrawAt.js";
import { IngestDraws } from "../../business/IngestDraws.js";
import { ListDraws } from "../../business/ListDraws.js";
import type { Draw } from "../../domain/model/Draw.model.js";

/** 도메인 원형을 계약 모양으로 옮긴다 */
const toDraw = (draw: Draw): LotterietusDraw => ({
  round: draw.round,
  numbers: [...draw.numbers],
  bonus: draw.bonus,
  drawnAt: draw.drawnAt,
});

/**
 * 모듈 밖에 한 약속. 컨트롤러·수집 스케줄러, 그리고 조립 루트가 꽂아 줄 다른 모듈(statistics·simulation·results)이 본다.
 * 유스케이스를 부르고 도메인 원형을 계약 모양으로 옮긴다 — 밖으로는 직렬화 가능한 값만 내준다.
 * findAll 은 회차 오름차순, 마지막 원소가 최신 회차다. 받는 모듈의 포트가 계약 타입(LotterietusDraw, 가변 배열)을 쓴다.
 */
@Injectable()
export class LotterietusFacade {
  constructor(
    @Inject(GetLotterietusStatus) private readonly getStatus: GetLotterietusStatus,
    @Inject(IngestDraws) private readonly ingestDraws: IngestDraws,
    @Inject(ListDraws) private readonly listDraws: ListDraws,
    @Inject(GetNextDrawAt) private readonly getNextDrawAt: GetNextDrawAt,
  ) {}

  async status(): Promise<LotterietusStatusResponse> {
    const { latest, nextRound, nextDrawAt } = await this.getStatus.execute();
    // 회차가 하나도 없으면 옛 응답 모양 그대로 회차 0·빈 번호로 낸다
    return {
      round: latest?.round ?? 0,
      numbers: latest ? [...latest.numbers] : [],
      bonus: latest?.bonus ?? 0,
      drawnAt: latest?.drawnAt ?? "",
      nextRound,
      nextDrawAt: nextDrawAt.toISOString(),
    };
  }

  async ingest(): Promise<{ ingestedCount: number; latestRound: number }> {
    const { ingestedCount, latestRound } = await this.ingestDraws.execute();
    return { ingestedCount, latestRound };
  }

  async findAll(): Promise<LotterietusDraw[]> {
    return (await this.listDraws.execute()).map(toDraw);
  }

  /** 지금 이후 가장 가까운 추첨 시각(ISO) — 수집 스케줄러가 다음 깨어날 때를 정한다 */
  nextDrawAt(): string {
    return this.getNextDrawAt.execute().toISOString();
  }
}
