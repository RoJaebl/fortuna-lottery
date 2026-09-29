import { describe, expect, it } from "vitest";
import { StatisticsGetResponseSchema } from "./schema.js";

const parse = (numbers: number[]) =>
  StatisticsGetResponseSchema.safeParse({
    totalDraws: 1,
    latestRound: 1,
    frequency: [1],
    sumDistribution: [{ sum: 21, count: 1 }],
    oddCountDist: [0],
    lowCountDist: [0],
    zoneCounts: [0],
    hotCold: [{ number: 1, count: 1, gap: 0 }],
    topPairs: [{ a: 1, b: 2, count: 1 }],
    recentGrid: [{ round: 1, numbers }],
    totalCombinations: 8145060,
  }).success;

describe("StatisticsGetResponseSchema", () => {
  it("유효한 조합을 통과시킨다", () => {
    expect(parse([1, 2, 3, 4, 5, 6])).toBe(true);
  });
  it("원소 7개를 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });
  it("46 이 섞인 조합을 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 46])).toBe(false);
  });
  it("중복을 거부한다", () => {
    expect(parse([1, 1, 2, 3, 4, 5])).toBe(false);
  });
});
