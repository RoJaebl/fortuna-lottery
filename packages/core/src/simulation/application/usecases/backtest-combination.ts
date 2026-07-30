import { createCombination } from "../../../shared/combination";
import { ok, type Result } from "../../../shared/result";
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
import { backtest } from "../../domain/backtest";
import type { SimulationRequest, SimulationResponse } from "../../dto/simulation.dto";

/** 백테스트 유스케이스 — 조합 검증 후 전 회차 채점 */
export const makeBacktestCombination =
  (drawData: DrawDataPort) =>
  async (request: SimulationRequest): Promise<Result<SimulationResponse>> => {
    const combo = createCombination(request.numbers);
    if (!combo.ok) return combo;
    const draws = await drawData.getAllDraws();
    return ok(backtest(combo.value, draws));
  };
