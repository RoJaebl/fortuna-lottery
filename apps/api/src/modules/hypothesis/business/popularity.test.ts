import { describe, expect, it } from "vitest";
import { popularityPatterns } from "./popularity.js";

const draw = (numbers: number[]) => ({ round: 1, numbers, bonus: 45, drawnAt: "2026-01-01" });

describe("popularityPatterns", () => {
  it("birthday 와 consecutive", () => {
    expect(popularityPatterns([1, 2, 3, 10, 20, 30], [])).toEqual(["birthday", "consecutive"]);
  });
  it("birthday 와 arithmetic", () => {
    expect(popularityPatterns([5, 10, 15, 20, 25, 30], [])).toEqual(["birthday", "arithmetic"]);
  });
  it("해당 없음", () => {
    expect(popularityPatterns([3, 14, 25, 36, 40, 45], [])).toEqual([]);
  });
  it("과거 1등과 같으면 pastWinner", () => {
    expect(popularityPatterns([40, 3, 14, 25, 36, 45], [draw([3, 14, 25, 36, 40, 45])])).toEqual(["pastWinner"]);
  });
});
