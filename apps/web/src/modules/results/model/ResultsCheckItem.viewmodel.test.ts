import { describe, expect, it } from "vitest";
import { ResultsCheckItemModel } from "./ResultsCheckItem.model";
import { ResultsCheckItemViewModel } from "./ResultsCheckItem.viewmodel";

const item = (over: Partial<ResultsCheckItemModel>) =>
  ResultsCheckItemViewModel.from(
    Object.assign(new ResultsCheckItemModel(), {
      pickId: "p1",
      numbers: [1, 2, 3, 40, 41, 42],
      matchedNumbers: [],
      matchedCount: 0,
      bonusMatched: false,
      rank: 0,
      ...over,
    }),
  );

describe("ResultsCheckItemViewModel (대조 결과 하나로 정해지는 표기)", () => {
  it("resultLabel — 등수 · 근접 · 보너스만 · 일치 없음 순으로 사실 그대로 적는다", () => {
    expect(item({ rank: 5, matchedCount: 3 }).resultLabel).toBe("5등");
    expect(item({ matchedCount: 2 }).resultLabel).toBe("2개 일치 — 낙첨");
    expect(item({ matchedCount: 2, bonusMatched: true }).resultLabel).toBe("2개 일치 + 보너스 — 낙첨");
    expect(item({ bonusMatched: true }).resultLabel).toBe("보너스만 일치 — 낙첨");
    expect(item({}).resultLabel).toBe("일치 없음 — 낙첨");
  });

  it("balls — 번호마다 일치 여부를 붙인다", () => {
    expect(item({ matchedNumbers: [2, 41] }).balls.filter((b) => b.matched).map((b) => b.n)).toEqual([2, 41]);
  });
});
