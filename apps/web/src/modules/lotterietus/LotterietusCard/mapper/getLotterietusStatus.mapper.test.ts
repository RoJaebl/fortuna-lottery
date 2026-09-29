import { describe, expect, it } from "vitest";
import { LotterietusModel } from "../../model/Lotterietus.model";
import { getLotterietusStatusResponse } from "./getLotterietusStatus.mapper";

describe("getLotterietusStatus 변환기", () => {
  it("응답을 도메인 원형으로 옮긴다 (두 시각을 Date 로)", () => {
    const model = getLotterietusStatusResponse({
      round: 1243,
      numbers: [9, 18, 24, 38, 43, 44],
      bonus: 35,
      drawnAt: "2026-09-26T11:35:00.000Z",
      nextRound: 1244,
      nextDrawAt: "2026-10-03T11:35:00.000Z",
    });

    expect(model).toBeInstanceOf(LotterietusModel);
    expect(model.numbers).toEqual([9, 18, 24, 38, 43, 44]);
    expect(model.drawnAt.toISOString()).toBe("2026-09-26T11:35:00.000Z");
    expect(model.nextDrawAt.toISOString()).toBe("2026-10-03T11:35:00.000Z");
  });
});
