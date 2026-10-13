import { describe, expect, it } from "vitest";
import { backtestAssumption } from "./backtestAssumption.js";

const draws = Array.from({ length: 105 }, (_, i) => {
  const base = ((i * 7) % 40) + 1;
  return { round: i + 1, numbers: [0, 1, 2, 3, 4, 5].map((d) => base + d), bonus: 45, drawnAt: "2026-01-01" };
});
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

describe("backtestAssumption", () => {
  it("센 회차 5 개 x 20 장", () => {
    const r = backtestAssumption({ excludePastWinners: true, topK: 20 }, draws);
    expect(r.assumed.tickets).toBe(100);
    expect(r.random.tickets).toBe(100);
    expect(sum(r.assumed.rankCounts)).toBe(100);
    expect(sum(r.random.rankCounts)).toBe(100);
    expect(r.assumed.rankCounts).toHaveLength(6);
  });
  it("무작위 쪽은 가정이 달라도 같다", () => {
    const a = backtestAssumption({ excludePastWinners: true, topK: 20 }, draws);
    const b = backtestAssumption({ excludePastWinners: false, topK: 30 }, draws);
    expect(a.random).toEqual(b.random);
  });
  it("같은 입력은 같은 결과", () => {
    const a = { excludePastWinners: false, topK: 20 };
    expect(backtestAssumption(a, draws)).toEqual(backtestAssumption(a, draws));
  });
});
