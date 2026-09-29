import type { StatisticsGetResponse } from "@fortuna-lottery/contract/statistics";
import type { StatisticsModel } from "../../model/statistics.model";

/** 응답 DTO → FE 모델 (와이어 이음새) */
export function assembleStatistics(dto: StatisticsGetResponse): StatisticsModel {
  return {
    totalDraws: dto.totalDraws,
    latestRound: dto.latestRound,
    frequency: [...dto.frequency],
    sumDistribution: dto.sumDistribution.map((e) => ({ ...e })),
    oddCountDist: [...dto.oddCountDist],
    lowCountDist: [...dto.lowCountDist],
    zoneCounts: [...dto.zoneCounts],
    hotCold: dto.hotCold.map((e) => ({ ...e })),
    topPairs: dto.topPairs.map((e) => ({ ...e })),
    recentGrid: dto.recentGrid.map((e) => ({ round: e.round, numbers: [...e.numbers] })),
    totalCombinations: dto.totalCombinations,
  };
}
