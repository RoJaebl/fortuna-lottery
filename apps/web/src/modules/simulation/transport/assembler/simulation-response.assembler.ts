import type { SimulationResponse } from "@fortuna-lottery/core/simulation/dto";
import type { BacktestModel } from "../../model/simulation.model";

export function assembleBacktest(dto: SimulationResponse): BacktestModel {
  return {
    totalDraws: dto.totalDraws,
    rankCounts: [...dto.rankCounts],
    wins: dto.wins.map((w) => ({ ...w })),
  };
}
