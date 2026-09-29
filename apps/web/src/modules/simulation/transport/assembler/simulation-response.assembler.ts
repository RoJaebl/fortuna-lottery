import type { SimulationBacktestResponse } from "@fortuna-lottery/contract/simulation";
import type { BacktestModel } from "../../model/simulation.model";

export function assembleBacktest(dto: SimulationBacktestResponse): BacktestModel {
  return {
    totalDraws: dto.totalDraws,
    rankCounts: [...dto.rankCounts],
    wins: dto.wins.map((w) => ({ ...w })),
  };
}
