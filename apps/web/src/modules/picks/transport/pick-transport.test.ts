import { describe, expect, it } from "vitest";
import { assemblePick } from "./assembler/pick-response.assembler";
import { mapSavePickRequest } from "./mapper/save-pick-request.mapper";

describe("picks 와이어 이음새 (mapper/assembler)", () => {
  it("mapper — FE 배열을 요청 DTO로 (원본 비공유 복사)", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const req = mapSavePickRequest(numbers);
    expect(req).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(req.numbers).not.toBe(numbers);
  });

  it("assembler — 응답 DTO를 FE 모델로 (날짜 파싱)", () => {
    const model = assemblePick({
      id: "p1",
      numbers: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-07-03T12:00:00.000Z",
    });
    expect(model.id).toBe("p1");
    expect(model.createdAt).toBeInstanceOf(Date);
    expect(model.createdAt.toISOString()).toBe("2026-07-03T12:00:00.000Z");
  });
});
