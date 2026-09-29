import { describe, expect, it } from "vitest";
import { lowCountOf, oddCountOf, sumOf } from "./Combination.model";

describe("번호 배열 하나만 보는 규칙", () => {
  it("sumOf / oddCountOf / lowCountOf", () => {
    expect(sumOf([1, 2, 3, 4, 5, 6])).toBe(21);
    expect(oddCountOf([1, 2, 3, 4, 5, 6])).toBe(3);
    expect(lowCountOf([1, 22, 23, 30, 40, 45])).toBe(2);
  });
});
