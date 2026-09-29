import { Inject, Injectable } from "@nestjs/common";
import type { SimulationBacktestRequest, SimulationBacktestResponse } from "@fortuna-lottery/contract/simulation";
import { RequestRejected } from "../../../../infrastructure/http/RequestRejected.js";
import { BacktestCombination } from "../../business/BacktestCombination.js";
import type { Backtest } from "../../domain/model/Backtest.model.js";

/** 도메인 원형을 계약 모양으로 옮긴다 — 읽기 전용 배열을 가변 복사본으로 */
const toResponse = (b: Backtest): SimulationBacktestResponse => ({
  totalDraws: b.totalDraws,
  rankCounts: [...b.rankCounts],
  wins: b.wins.map((w) => ({ ...w })),
});

@Injectable()
export class SimulationFacade {
  constructor(@Inject(BacktestCombination) private readonly backtestCombination: BacktestCombination) {}

  async backtest(request: SimulationBacktestRequest): Promise<SimulationBacktestResponse> {
    const result = await this.backtestCombination.execute(request);
    if (!result.ok) throw new RequestRejected(result.error);
    return toResponse(result.value);
  }
}
