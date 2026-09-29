import { describe, expect, it } from "vitest";
import { ResultsCheckItemSchema, ResultsCheckResponseSchema } from "./schema.js";

const item = (numbers: number[]) => ({
  pickId: "a", numbers, matchedNumbers: [1], matchedCount: 1, bonusMatched: false, rank: 0,
});
const draw = (numbers: number[]) => ({ round: 1, numbers, bonus: 7, drawnAt: "2002-12-07" });
const parse = (numbers: number[]) => ResultsCheckItemSchema.safeParse(item(numbers)).success;

describe("ResultsCheckItemSchema", () => {
  it("유효한 조합을 통과시킨다", () => {
    expect(parse([1, 2, 3, 4, 5, 6])).toBe(true);
  });
  it("원소 7개를 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 6, 7])).toBe(false);
  });
  it("46 이 섞인 조합을 거부한다", () => {
    expect(parse([1, 2, 3, 4, 5, 46])).toBe(false);
  });
  it("중복은 모양 검사에서 통과한다", () => {
    // 중복 금지는 도메인 규칙이라 kernel createCombination 이 지킨다. 와이어 계약은 모양만 본다.
    expect(parse([1, 1, 2, 3, 4, 5])).toBe(true);
  });
});

describe("ResultsCheckResponseSchema", () => {
  const ok = [1, 2, 3, 4, 5, 6];
  it("draw 는 null 이거나 유효한 LotterietusDraw 다", () => {
    expect(ResultsCheckResponseSchema.safeParse({ draw: null, items: [] }).success).toBe(true);
    expect(ResultsCheckResponseSchema.safeParse({ draw: draw(ok), items: [item(ok)] }).success).toBe(true);
    expect(ResultsCheckResponseSchema.safeParse({ draw: draw([1, 2, 3, 4, 5, 46]), items: [] }).success).toBe(false);
  });
});
