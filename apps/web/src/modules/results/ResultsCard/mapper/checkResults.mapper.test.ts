import { describe, expect, it } from "vitest";
import { ResultsCheckModel, ResultsDrawModel } from "../../model/ResultsCheck.model";
import { ResultsCheckItemModel } from "../../model/ResultsCheckItem.model";
import { checkResultsResponse } from "./checkResults.mapper";

describe("checkResults 변환기", () => {
  it("응답을 도메인 원형으로 옮긴다 — 추첨 시각은 쓰지 않으므로 버린다", () => {
    const res = {
      draw: { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      items: [
        { pickId: "p1", numbers: [1, 2, 3, 40, 41, 42], matchedNumbers: [1, 2, 3], matchedCount: 3, bonusMatched: false, rank: 5 },
      ],
    };
    const model = checkResultsResponse(res);

    expect(model).toBeInstanceOf(ResultsCheckModel);
    expect(model.draw).toBeInstanceOf(ResultsDrawModel);
    expect({ ...model.draw }).toEqual({ round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 });
    expect(model.items[0]).toBeInstanceOf(ResultsCheckItemModel);
    expect({ ...model.items[0] }).toEqual(res.items[0]);
    expect(model.items[0]?.numbers).not.toBe(res.items[0]?.numbers);
  });

  it("회차가 없으면 draw 는 null 이다", () => {
    expect(checkResultsResponse({ draw: null, items: [] }).draw).toBeNull();
  });
});
