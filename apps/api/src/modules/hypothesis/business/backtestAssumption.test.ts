import { describe, expect, it } from "vitest";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { hitRate } from "./assumption.js";
import { backtestAssumption } from "./backtestAssumption.js";

const draws = Array.from({ length: 105 }, (_, i) => {
  const base = ((i * 7) % 40) + 1;
  return { round: i + 1, numbers: [0, 1, 2, 3, 4, 5].map((d) => base + d), bonus: 45, drawnAt: "2026-01-01" };
});
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const as = (excludePastWinners: boolean, topK: number | null): Assumption => ({
  excludePastWinners,
  topK,
  sumRange: { min: 21, max: 255 },
  fixed: [],
});

describe("backtestAssumption", () => {
  it("센 회차 5 개 x 20 장", () => {
    const r = backtestAssumption(as(true, 20), draws);
    expect(r.assumed.tickets).toBe(100);
    expect(r.random.tickets).toBe(100);
    expect(sum(r.assumed.rankCounts)).toBe(100);
    expect(sum(r.random.rankCounts)).toBe(100);
    expect(r.assumed.rankCounts).toHaveLength(6);
  });
  it("무작위 쪽은 가정이 달라도 같다", () => {
    const a = backtestAssumption(as(true, 20), draws);
    const b = backtestAssumption(as(false, 30), draws);
    expect(a.random).toEqual(b.random);
  });
  it("구간을 건 가정: assumed 장수 = 센 회차 x 20", () => {
    const a: Assumption = { ...as(true, null), sumRange: { min: 80, max: 120 } };
    const { rounds } = hitRate(a, draws);
    expect(rounds).toBe(105);
    expect(backtestAssumption(a, draws).assumed.tickets).toBe(rounds * 20);
  });
  it("같은 입력은 같은 결과", () => {
    const a = as(false, 20);
    expect(backtestAssumption(a, draws)).toEqual(backtestAssumption(a, draws));
  });
});
