import { Inject, Injectable } from "@nestjs/common";
import type { StatisticsGetResponse } from "@fortuna-lottery/contract/statistics";
import { GetStatistics } from "../../business/GetStatistics.js";
import type { Statistics } from "../../domain/model/Statistics.model.js";

/** 도메인 원형을 계약 모양으로 옮긴다 — 읽기 전용 배열을 가변 복사본으로 */
const toResponse = (s: Statistics): StatisticsGetResponse => ({
  totalDraws: s.totalDraws,
  latestRound: s.latestRound,
  frequency: [...s.frequency],
  sumDistribution: s.sumDistribution.map((e) => ({ ...e })),
  oddCountDist: [...s.oddCountDist],
  lowCountDist: [...s.lowCountDist],
  zoneCounts: [...s.zoneCounts],
  hotCold: s.hotCold.map((e) => ({ ...e })),
  topPairs: s.topPairs.map((e) => ({ ...e })),
  recentGrid: s.recentGrid.map((e) => ({ round: e.round, numbers: [...e.numbers] })),
  totalCombinations: s.totalCombinations,
});

@Injectable()
export class StatisticsFacade {
  constructor(@Inject(GetStatistics) private readonly getStatistics: GetStatistics) {}

  async get(): Promise<StatisticsGetResponse> {
    return toResponse(await this.getStatistics.execute());
  }
}
