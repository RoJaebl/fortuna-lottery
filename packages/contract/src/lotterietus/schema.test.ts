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
  it("중복을 거부한다", () => {
    expect(parse([1, 1, 2, 3, 4, 5])).toBe(false);
  });
});
