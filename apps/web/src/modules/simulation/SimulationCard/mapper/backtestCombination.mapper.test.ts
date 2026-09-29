import { describe, expect, it } from "vitest";
import { SimulationResultModel } from "../../model/SimulationResult.model";
import { backtestCombinationRequest, backtestCombinationResponse } from "./backtestCombination.mapper";

describe("backtestCombination 변환기", () => {
  it("요청은 번호 배열을 원본과 공유하지 않는다", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const request = backtestCombinationRequest(numbers);

    expect(request).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(request.numbers).not.toBe(numbers);
  });

  it("응답을 도메인 원형으로 옮긴다", () => {
    const res = { totalDraws: 2, rankCounts: [1, 1, 0, 0, 0, 0], wins: [{ round: 1, rank: 1, matchedCount: 6 }] };
    const model = backtestCombinationResponse(res);

    expect(model).toBeInstanceOf(SimulationResultModel);
    expect({ ...model }).toEqual(res);
    expect(model.wins[0]).not.toBe(res.wins[0]);
  });
});
