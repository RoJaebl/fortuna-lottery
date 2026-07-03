import { describe, expect, it } from "vitest";
import { createCombination } from "./combination";

describe("createCombination (CombinationVO)", () => {
  it("유효한 6개 번호를 오름차순으로 정렬해 반환한다", () => {
    const result = createCombination([45, 1, 22, 7, 33, 14]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([1, 7, 14, 22, 33, 45]);
  });

  it("6개가 아니면 실패한다", () => {
    expect(createCombination([1, 2, 3, 4, 5]).ok).toBe(false);
    expect(createCombination([1, 2, 3, 4, 5, 6, 7]).ok).toBe(false);
  });

  it("범위(1~45)를 벗어나면 실패한다", () => {
    expect(createCombination([0, 2, 3, 4, 5, 6]).ok).toBe(false);
    expect(createCombination([1, 2, 3, 4, 5, 46]).ok).toBe(false);
  });

  it("정수가 아니면 실패한다", () => {
    expect(createCombination([1.5, 2, 3, 4, 5, 6]).ok).toBe(false);
  });

  it("중복이 있으면 실패한다", () => {
    expect(createCombination([1, 1, 3, 4, 5, 6]).ok).toBe(false);
  });
});
