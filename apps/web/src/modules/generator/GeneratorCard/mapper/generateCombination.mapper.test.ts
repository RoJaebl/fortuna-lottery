import { describe, expect, it } from "vitest";
import { GeneratedCombinationModel } from "../../model/GeneratedCombination.model";
import { generateCombinationRequest, generateCombinationResponse } from "./generateCombination.mapper";

describe("generateCombination 변환기", () => {
  it("자동 모드는 빈 요청이다 — 고른 번호를 보내지 않는다", () => {
    expect(generateCombinationRequest("auto", [3, 5])).toEqual({});
  });

  it("부분 선택·직접 입력은 고른 번호를 고정 번호로 보낸다", () => {
    expect(generateCombinationRequest("semi", [7, 14])).toEqual({ fixedNumbers: [7, 14] });
    expect(generateCombinationRequest("manual", [1, 2, 3, 4, 5, 6])).toEqual({
      fixedNumbers: [1, 2, 3, 4, 5, 6],
    });
  });

  it("응답을 도메인 원형으로 옮긴다", () => {
    const model = generateCombinationResponse({ numbers: [1, 7, 14, 22, 33, 45] });

    expect(model).toBeInstanceOf(GeneratedCombinationModel);
    expect(model.numbers).toEqual([1, 7, 14, 22, 33, 45]);
  });
});
