import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import { describe, expect, it } from "vitest";
import { EvaluateAssumption } from "./EvaluateAssumption.js";

const draw = (round: number, numbers: number[]): Draw => ({ round, numbers, bonus: 45, drawnAt: "2002-12-07T11:35:00.000Z" });
const evaluate = (draws: Draw[]) => new EvaluateAssumption({ findAll: async () => draws });

describe("EvaluateAssumption", () => {
  it("백테스트는 고른 번호와 무관하다", async () => {
    const draws = Array.from({ length: 105 }, (_, i) => draw(i + 1, Array.from({ length: 6 }, (_, j) => ((i + j) % 40) + 1)));
    const base = { sumRange: { min: 21, max: 255 }, excludePastWinners: true };
    const none = await evaluate(draws).execute({ ...base, fixed: [] });
    const some = await evaluate(draws).execute({ ...base, fixed: [1, 2, 3, 4, 5] });
    if (!none.ok || !some.ok) throw new Error("평가 실패");
    expect(some.value.backtest).toEqual(none.value.backtest);
  });

  it("K 를 켜면 기대 적중 수는 회차마다의 풀로 센다", async () => {
    // 앞 100 회로 풀은 1~7(구간 안 조합 7 개), 뒤 120 회로 지금 풀은 1·40~45(40~45 는 합 255 라 6 개)
    const draws = [
      ...Array.from({ length: 100 }, (_, i) => draw(i + 1, i % 2 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 7])),
      ...Array.from({ length: 120 }, (_, i) => draw(i + 101, [40, 41, 42, 43, 44, 45])),
    ];
    const r = await evaluate(draws).execute({ sumRange: { min: 21, max: 240 }, excludePastWinners: false, topK: 7, fixed: [] });
    if (!r.ok) throw new Error(r.error);
    const { hitRate, expectedHits } = r.value;
    expect(expectedHits).toBeGreaterThan(0);
    expect(expectedHits).toBeCloseTo(hitRate.expectedRate * hitRate.rounds, 12);
  });
});
