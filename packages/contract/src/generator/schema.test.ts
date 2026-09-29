import { describe, expect, it } from "vitest";
import { GeneratorGenerateResponseSchema } from "./schema.js";

const parse = (numbers: number[]) => GeneratorGenerateResponseSchema.safeParse({ numbers }).success;

describe("GeneratorGenerateResponseSchema", () => {
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
