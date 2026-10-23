import { describe, expect, it } from "vitest";
import { PickModel } from "./Pick.model";
import { PickViewModel } from "./Pick.viewmodel";

describe("PickViewModel", () => {
  it("savedAt — 저장 시각을 로컬 시각 YYYY.MM.DD HH:mm 으로 적는다", () => {
    const pick = Object.assign(new PickModel(), {
      id: "p1",
      numbers: [1, 2, 3, 4, 5, 6],
      createdAt: new Date(2026, 6, 3, 9, 5),
    });

    expect(PickViewModel.from(pick).savedAt).toBe("2026.07.03 09:05");
  });
});
