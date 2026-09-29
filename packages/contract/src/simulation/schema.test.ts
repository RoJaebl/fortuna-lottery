import { describe, expect, it } from "vitest";
import { SimulationBacktestRequestSchema, SimulationBacktestResponseSchema } from "./schema.js";

const parse = (numbers: number[]) => SimulationBacktestRequestSchema.safeParse({ numbers }).success;

describe("SimulationBacktestRequestSchema", () => {
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

describe("SimulationBacktestResponseSchema", () => {
  it("모양을 검사한다", () => {
    const res = { totalDraws: 1, rankCounts: [1, 0, 0, 0, 0, 0], wins: [{ round: 1, rank: 5, matchedCount: 3 }] };
    expect(SimulationBacktestResponseSchema.safeParse(res).success).toBe(true);
    expect(SimulationBacktestResponseSchema.safeParse({ ...res, wins: [{ round: 1 }] }).success).toBe(false);
  });
});
