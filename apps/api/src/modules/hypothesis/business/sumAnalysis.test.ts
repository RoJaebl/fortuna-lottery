import { describe, expect, it } from "vitest";
import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { combinationKey } from "./assumption.js";
import { numberBoard, sumBands, sumCounts } from "./sumAnalysis.js";

// 합이 s 인 본 번호 여섯 개(1,2,3,4,5 + (s-15)) — s ≥ 21 이면 여섯째가 6 이상이라 겹치지 않는다.
const drawOf = (s: number, round: number): Draw => ({ round, numbers: [1, 2, 3, 4, 5, s - 15], bonus: 45 }) as Draw;
const draws = (sums: number[]) => sums.map((s, i) => drawOf(s, i + 1));
const a = (over: Partial<Assumption>): Assumption => ({
  excludePastWinners: false,
  topK: null,
  sumRange: { min: 21, max: 255 },
  fixed: [],
  ...over,
});
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("sumBands", () => {
  const counts = sumCounts(draws([100, 100, 101, 130]));

  it("합 개수 표는 길이 235", () => {
    expect(counts).toHaveLength(235);
    expect(counts[100 - 21]).toBe(2);
  });

  it("최댓값의 90% 이상인 창이 많이 든 구간이다", () => {
    expect(sumBands(counts, 2, 4).frequentBands).toEqual([{ min: 100, max: 101, count: 3, rate: 0.75 }]);
  });

  it("한 번도 안 나온 합이 폭 이상 이어진 줄이 빈 구간이다", () => {
    expect(sumBands(counts, 2, 4).emptyBands).toEqual([
      { min: 21, max: 99 },
      { min: 102, max: 129 },
      { min: 131, max: 255 },
    ]);
  });

  it("사이의 빈 칸이 폭보다 짧으면 빈 구간이 아니다", () => {
    const c = sumCounts(draws([100, 102]));
    expect(sumBands(c, 2, 2).emptyBands.some((b) => b.min <= 101 && b.max >= 101)).toBe(false);
  });

  it("최댓값이 같은 맞닿은 창은 하나로 합친다", () => {
    const c = sumCounts(draws([100, 102]));
    expect(sumBands(c, 2, 2).frequentBands).toEqual([{ min: 99, max: 103, count: 1, rate: 0.5 }]);
  });

  it("합친 띠의 회차 수는 창들 가운데 최댓값이다", () => {
    const c = sumCounts(draws([...Array<number>(9).fill(100), 101]));
    expect(sumBands(c, 2, 10).frequentBands).toEqual([{ min: 99, max: 101, count: 10, rate: 1 }]);
  });

  it("회차가 없으면 띠가 없고 비율은 0", () => {
    const r = sumBands(sumCounts([]), 10, 0);
    expect(r.frequentBands).toEqual([]);
    expect(r.maxWindowRate).toBe(0);
  });

  it("가장 많이 든 창의 비율을 낸다", () => {
    expect(sumBands(counts, 2, 4).maxWindowRate).toBe(0.75);
  });
});

describe("numberBoard", () => {
  it("풀 밖 번호는 불가능, 고른 번호는 늘 가능", () => {
    const board = numberBoard([], a({ topK: 6, fixed: [3] }), range(6), new Set());
    expect(board).toHaveLength(45);
    expect(board.filter((b) => b.possible).map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("구간 안 회차에서 번호가 나온 횟수를 센다", () => {
    const board = numberBoard(draws([40, 40, 60]), a({ sumRange: { min: 30, max: 50 } }), range(45), new Set());
    expect(board[0]).toEqual({ n: 1, possible: true, count: 2 });
    expect(board.find((b) => b.n === 25)!.count).toBe(2);
    expect(board.find((b) => b.n === 45)!.count).toBe(0);
  });

  it("제외를 끄면 과거 1등 조합도 남은 조합으로 센다", () => {
    const board = numberBoard([], a({ topK: 6 }), range(6), new Set([combinationKey([1, 2, 3, 4, 5, 6])]));
    expect(board.filter((b) => b.possible).map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("제외하면 남은 조합이 사라지는 번호는 불가능이다", () => {
    const board = numberBoard([], a({ excludePastWinners: true, topK: 6 }), range(6), new Set([combinationKey([1, 2, 3, 4, 5, 6])]));
    expect(board.every((b) => !b.possible)).toBe(true);
  });
});
