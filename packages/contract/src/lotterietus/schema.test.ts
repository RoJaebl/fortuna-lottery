import { describe, expect, it } from "vitest";
import { LotterietusDrawSchema, LotterietusStatusResponseSchema } from "./schema.js";

const draw = (numbers: number[]) =>
  LotterietusDrawSchema.safeParse({ round: 1, numbers, bonus: 7, drawnAt: "2002-12-07" }).success;
const status = (numbers: number[]) =>
  LotterietusStatusResponseSchema.safeParse({
    round: 1, numbers, bonus: 7, drawnAt: "2002-12-07", nextRound: 2, nextDrawAt: "2002-12-14",
  }).success;

describe.each([
  ["LotterietusDrawSchema", draw],
  ["LotterietusStatusResponseSchema", status],
])("%s", (_name, parse) => {
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

describe("빈 번호 배열", () => {
  it("현황 응답은 회차가 없을 때의 빈 상태로 받는다", () => {
    expect(status([])).toBe(true);
  });
  it("회차 조각은 받지 않는다", () => {
    expect(draw([])).toBe(false);
  });
});
