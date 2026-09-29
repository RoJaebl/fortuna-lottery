import { Inject, Injectable } from "@nestjs/common";
import type { ResultsCheckResponse } from "@fortuna-lottery/contract/results";
import { CheckResults } from "../../business/CheckResults.js";
import type { ResultsCheck } from "../../domain/model/ResultsCheck.model.js";
import { CURRENT_USER, type CurrentUserPort } from "../../domain/port/CurrentUserPort.js";

/** 도메인 원형을 계약 모양으로 옮긴다 — 읽기 전용 배열을 가변 복사본으로 */
const toResponse = (r: ResultsCheck): ResultsCheckResponse => ({
  draw: r.draw
    ? { round: r.draw.round, numbers: [...r.draw.numbers], bonus: r.draw.bonus, drawnAt: r.draw.drawnAt }
    : null,
  items: r.items.map((item) => ({
    pickId: item.pickId,
    numbers: [...item.numbers],
    matchedNumbers: [...item.matchedNumbers],
    matchedCount: item.matchedCount,
    bonusMatched: item.bonusMatched,
    rank: item.rank,
  })),
});

@Injectable()
export class ResultsFacade {
  constructor(
    @Inject(CURRENT_USER) private readonly user: CurrentUserPort,
    @Inject(CheckResults) private readonly checkResults: CheckResults,
  ) {}

  async check(): Promise<ResultsCheckResponse> {
    const { id } = await this.user.currentUser();
    return toResponse(await this.checkResults.execute(id));
  }
}
