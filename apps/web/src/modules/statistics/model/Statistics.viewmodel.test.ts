import { describe, expect, it } from "vitest";
import { StatisticsModel } from "./Statistics.model";
import { glowIntensity, StatisticsViewModel } from "./Statistics.viewmodel";

const stats = (over: Partial<StatisticsModel> = {}): StatisticsViewModel =>
  StatisticsViewModel.from(
    Object.assign(new StatisticsModel(), {
      totalDraws: 100,
      latestRound: 100,
      frequency: [],
      sumDistribution: [],
      oddCountDist: [],
      lowCountDist: [],
      zoneCounts: [],
      hotCold: [],
      topPairs: [],
      recentGrid: [],
      totalCombinations: 8_145_060,
      ...over,
    }),
  );

describe("StatisticsViewModel (그 통계 하나로 정해지는 값)", () => {
  it("glowIntensity — min~max를 0~1로 정규화", () => {
    expect(glowIntensity(10, 10, 20)).toBe(0);
    expect(glowIntensity(20, 10, 20)).toBe(1);
    expect(glowIntensity(15, 10, 20)).toBe(0.5);
    expect(glowIntensity(5, 5, 5)).toBe(0.5); // 편차 없음 → 중간값
  });

  it("glows — 번호별 빈도를 그 통계의 min~max 로 정규화한다", () => {
    expect(stats({ frequency: [10, 15, 20] }).glows).toEqual([0, 0.5, 1]);
  });

  it("probabilityFacts — 고정 분모 사실 서술", () => {
    const facts = stats({ totalCombinations: 8_145_060 }).probabilityFacts;
    expect(facts[0]).toContain("8,145,060");
    expect(facts.some((f) => f.includes("동일"))).toBe(true);
  });
});
