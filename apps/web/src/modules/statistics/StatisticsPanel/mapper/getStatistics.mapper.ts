import type { StatisticsGetResponse } from "@fortuna-lottery/contract/statistics";
import { StatisticsModel } from "../../model/Statistics.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 받는 값이 unknown 이라 여기서 한 번 좁힌다 */
export function getStatisticsResponse(res: unknown): StatisticsModel {
  const dto = res as StatisticsGetResponse;
  return Object.assign(new StatisticsModel(), {
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
  });
}
