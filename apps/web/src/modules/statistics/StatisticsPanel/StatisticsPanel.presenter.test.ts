import { describe, expect, it } from "vitest";
import { StatisticsModel } from "../model/Statistics.model";
import { oddEvenRarity, sumPosition } from "./StatisticsPanel.presenter";

const stats = (over: Partial<StatisticsModel> = {}): StatisticsModel =>
  Object.assign(new StatisticsModel(), {
    totalDraws: 100,
    latestRound: 100,
    frequency: [],
    sumDistribution: [],
    oddCountDist: [0, 0, 10, 30, 40, 15, 5],
    lowCountDist: [],
    zoneCounts: [],
    hotCold: [],
    topPairs: [],
    recentGrid: [],
    totalCombinations: 8_145_060,
    ...over,
  });

describe("statistics presenters (순수 함수)", () => {
  it("oddEvenRarity — 내 홀짝 패턴의 과거 출현 비율", () => {
    const r = oddEvenRarity([1, 3, 5, 7, 2, 4], stats()); // 홀 4
    expect(r.label).toBe("홀 4 : 짝 2");
    expect(r.percent).toBe(40);
  });

  it("sumPosition — 내 합계보다 작은 과거 회차 비율", () => {
    const s = stats({
      sumDistribution: [
        { sum: 100, count: 30 },
        { sum: 120, count: 40 },
        { sum: 140, count: 30 },
      ],
    });
    expect(sumPosition([20, 30, 10, 25, 15, 20], s)).toEqual({ mySum: 120, percentBelow: 30 });
  });
});
