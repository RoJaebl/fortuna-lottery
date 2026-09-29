import { Inject, Injectable } from "@nestjs/common";
import type { SimulationBacktestRequest } from "@fortuna-lottery/contract/simulation";
import { createCombination, ok, type Result } from "@fortuna-lottery/kernel";
import type { Backtest } from "../domain/model/Backtest.model.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { backtest } from "./backtest.js";

/** 백테스트 유스케이스 — 조합 검증 후 전 회차 채점 */
@Injectable()
export class BacktestCombination {
  constructor(@Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort) {}

  async execute(request: SimulationBacktestRequest): Promise<Result<Backtest>> {
    const combo = createCombination(request.numbers);
    if (!combo.ok) return combo;
    const draws = await this.drawHistory.findAll();
    return ok(backtest(combo.value, draws));
  }
}
