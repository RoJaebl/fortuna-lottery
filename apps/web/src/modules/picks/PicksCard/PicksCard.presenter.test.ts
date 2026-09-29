import { describe, expect, it } from "vitest";
import { saveButtonLabel } from "./PicksCard.presenter";

describe("PicksCard 표시 조정자", () => {
  it("saveButtonLabel — 저장 중 · 저장 가능 · 조합 없음 순으로 문구를 고른다", () => {
    expect(saveButtonLabel(true, true)).toBe("저장 중…");
    expect(saveButtonLabel(false, true)).toBe("현재 번호 저장");
    expect(saveButtonLabel(false, false)).toBe("먼저 번호를 생성하세요");
  });
});
