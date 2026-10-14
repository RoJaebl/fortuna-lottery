import { Inject, Injectable } from "@nestjs/common";
import type { HypothesisEvaluateRequest } from "@fortuna-lottery/contract/hypothesis";
import { ok, TOTAL_COMBINATIONS, type Result } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import type { Evaluation } from "../domain/model/Evaluation.model.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { assumedCombinations, hitRate } from "./assumption.js";
import { backtestAssumption } from "./backtestAssumption.js";

export const toAssumption = (r: HypothesisEvaluateRequest): Assumption => ({
  excludePastWinners: r.excludePastWinners,
  topK: r.topK ?? null,
});

/** 가정 평가 유스케이스 — 지금 가정 우주, 가정 적중률, 백테스트 */
@Injectable()
export class EvaluateAssumption {
  constructor(@Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort) {}

  async execute(request: HypothesisEvaluateRequest): Promise<Result<Evaluation>> {
    const assumption = toAssumption(request);
    const draws = await this.drawHistory.findAll();
    const { pool, count } = assumedCombinations(assumption, draws);
    return ok({
      totalCombinations: TOTAL_COMBINATIONS,
      assumedCombinations: count,
      pool,
      hitRate: hitRate(assumption, draws),
      backtest: backtestAssumption(assumption, draws),
    });
  }
}
