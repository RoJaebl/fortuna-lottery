import { describe, expect, it } from "vitest";
import { createCombination } from "../../shared/combination";
import type { Draw } from "../../lotterietus/domain/draw";
import { backtest } from "./backtest";

const combo = (ns: number[]) => {
  const r = createCombination(ns);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const draw = (round: number, numbers: number[], bonus: number): Draw => ({
  round,
  numbers,
  bonus,
  drawnAt: "2020-01-01T11:35:00.000Z",
});

describe("backtest (타임머신)", () => {
  it("전 회차를 채점해 등수별 횟수를 집계한다", () => {
    const target = combo([1, 2, 3, 4, 5, 6]);
    const draws = [
      draw(1, [1, 2, 3, 4, 5, 6], 7), // 1등
      draw(2, [1, 2, 3, 4, 5, 45], 6), // 5개 + 보너스(6 포함) = 2등
      draw(3, [1, 2, 3, 4, 44, 45], 43), // 4등
      draw(4, [40, 41, 42, 43, 44, 45], 39), // 낙첨
    ];
    const result = backtest(target, draws);
    expect(result.totalDraws).toBe(4);
    expect(result.rankCounts).toEqual([1, 1, 1, 0, 1, 0]);
    expect(result.wins).toEqual([
      { round: 1, rank: 1, matchedCount: 6 },
      { round: 2, rank: 2, matchedCount: 5 },
      { round: 3, rank: 4, matchedCount: 4 },
    ]);
  });

  it("빈 회차 목록이면 전부 0", () => {
    const result = backtest(combo([1, 2, 3, 4, 5, 6]), []);
    expect(result.totalDraws).toBe(0);
    expect(result.rankCounts).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result.wins).toEqual([]);
  });
});
