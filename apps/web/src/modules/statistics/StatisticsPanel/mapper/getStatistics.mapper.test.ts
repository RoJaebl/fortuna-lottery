import { describe, expect, it } from "vitest";
import { StatisticsModel } from "../../model/Statistics.model";
import { getStatisticsResponse } from "./getStatistics.mapper";

describe("getStatistics 변환기", () => {
  it("응답을 도메인 원형으로 옮긴다 — 배열은 응답과 공유하지 않는다", () => {
    const res = {
      totalDraws: 2,
      latestRound: 2,
      frequency: [2, 1],
      sumDistribution: [{ sum: 81, count: 1 }],
      oddCountDist: [0, 0, 0, 1, 0, 1, 0],
      lowCountDist: [0, 0, 0, 1, 1, 0, 0],
      zoneCounts: [5, 2, 2, 1, 2],
      hotCold: [{ number: 1, count: 2, gap: 0 }],
      topPairs: [{ a: 1, b: 2, count: 2 }],
      recentGrid: [{ round: 2, numbers: [1, 2, 13, 24, 35, 44] }],
      totalCombinations: 8_145_060,
    };
    const model = getStatisticsResponse(res);

    expect(model).toBeInstanceOf(StatisticsModel);
    expect({ ...model }).toEqual(res);
    expect(model.recentGrid[0]?.numbers).not.toBe(res.recentGrid[0]?.numbers);
    expect(model.hotCold[0]).not.toBe(res.hotCold[0]);
  });
});
