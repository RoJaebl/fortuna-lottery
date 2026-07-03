import { describe, expect, it } from "vitest";
import type { StatisticsModel } from "../model/statistics.model";
import {
  glowIntensity,
  lowCountOf,
  oddCountOf,
  oddEvenRarity,
  probabilityFacts,
  sumOf,
  sumPosition,
} from "./presenters";

const stats = (over: Partial<StatisticsModel> = {}): StatisticsModel => ({
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
  it("glowIntensity — min~max를 0~1로 정규화", () => {
    expect(glowIntensity(10, 10, 20)).toBe(0);
    expect(glowIntensity(20, 10, 20)).toBe(1);
    expect(glowIntensity(15, 10, 20)).toBe(0.5);
    expect(glowIntensity(5, 5, 5)).toBe(0.5); // 편차 없음 → 중간값
  });

  it("sumOf / oddCountOf / lowCountOf", () => {
    expect(sumOf([1, 2, 3, 4, 5, 6])).toBe(21);
    expect(oddCountOf([1, 2, 3, 4, 5, 6])).toBe(3);
    expect(lowCountOf([1, 22, 23, 30, 40, 45])).toBe(2);
  });

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

  it("probabilityFacts — 고정 분모 사실 서술", () => {
    const facts = probabilityFacts(8_145_060);
    expect(facts[0]).toContain("8,145,060");
    expect(facts.some((f) => f.includes("동일"))).toBe(true);
  });
});
