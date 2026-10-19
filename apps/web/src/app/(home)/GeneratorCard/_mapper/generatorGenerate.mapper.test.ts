import { describe, expect, it } from "vitest";
import { GeneratedCombinationModel } from "../_model/GeneratedCombination.model";
import { generatorGenerateRequest, generatorGenerateResponse } from "./generatorGenerate.mapper";

describe("generatorGenerate 변환기", () => {
  it("자동 모드는 빈 요청이다 — 고른 번호를 보내지 않는다", () => {
    expect(generatorGenerateRequest("auto", [3, 5])).toEqual({});
  });

  it("부분 선택·직접 입력은 고른 번호를 고정 번호로 보낸다", () => {
    expect(generatorGenerateRequest("semi", [7, 14])).toEqual({ fixedNumbers: [7, 14] });
    expect(generatorGenerateRequest("manual", [1, 2, 3, 4, 5, 6])).toEqual({
      fixedNumbers: [1, 2, 3, 4, 5, 6],
    });
  });

  it("응답을 도메인 원형으로 옮긴다", () => {
    const model = generatorGenerateResponse({ numbers: [1, 7, 14, 22, 33, 45] });

    expect(model).toBeInstanceOf(GeneratedCombinationModel);
    expect(model.numbers).toEqual([1, 7, 14, 22, 33, 45]);
  });
});
