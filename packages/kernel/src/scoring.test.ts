import { describe, expect, it } from "vitest";
import { createCombination } from "./combination";
import { scoreAgainstDraw } from "./scoring";

const combo = (ns: number[]) => {
  const r = createCombination(ns);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const DRAW = [1, 2, 3, 4, 5, 6] as const;
const BONUS = 7;

describe("scoreAgainstDraw (공식 등수 규칙)", () => {
  it("6개 일치 = 1등", () => {
    expect(scoreAgainstDraw(combo([1, 2, 3, 4, 5, 6]), DRAW, BONUS).rank).toBe(1);
  });

  it("5개 + 보너스 = 2등", () => {
    const s = scoreAgainstDraw(combo([1, 2, 3, 4, 5, 7]), DRAW, BONUS);
    expect(s.rank).toBe(2);
    expect(s.bonusMatched).toBe(true);
  });

  it("5개 (보너스 없음) = 3등", () => {
    expect(scoreAgainstDraw(combo([1, 2, 3, 4, 5, 45]), DRAW, BONUS).rank).toBe(3);
  });

  it("4개 = 4등", () => {
    expect(scoreAgainstDraw(combo([1, 2, 3, 4, 44, 45]), DRAW, BONUS).rank).toBe(4);
  });

  it("3개 = 5등", () => {
    expect(scoreAgainstDraw(combo([1, 2, 3, 43, 44, 45]), DRAW, BONUS).rank).toBe(5);
  });

  it("2개 이하 = 낙첨 (보너스만 맞아도 낙첨)", () => {
    expect(scoreAgainstDraw(combo([1, 2, 7, 43, 44, 45]), DRAW, BONUS).rank).toBe(0);
  });

  it("matchedNumbers는 실제 일치 번호를 담는다", () => {
    const s = scoreAgainstDraw(combo([1, 2, 3, 43, 44, 45]), DRAW, BONUS);
    expect(s.matchedNumbers).toEqual([1, 2, 3]);
    expect(s.matchedCount).toBe(3);
  });
});
