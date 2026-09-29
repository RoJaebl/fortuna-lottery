import { describe, expect, it } from "vitest";
import { canGenerate, modeHint } from "./GeneratorCard.presenter";

describe("GeneratorCard 표시 조정자", () => {
  it("canGenerate — 자동은 언제나, 부분 선택은 1~5개, 직접 입력은 6개일 때만", () => {
    expect(canGenerate("auto", 0)).toBe(true);
    expect(canGenerate("semi", 0)).toBe(false);
    expect(canGenerate("semi", 5)).toBe(true);
    expect(canGenerate("semi", 6)).toBe(false);
    expect(canGenerate("manual", 5)).toBe(false);
    expect(canGenerate("manual", 6)).toBe(true);
  });

  it("modeHint — 모드와 고른 개수로 안내 문구를 만든다", () => {
    expect(modeHint("auto", 0)).toBe("6개 번호를 무작위로 생성합니다");
    expect(modeHint("semi", 2)).toBe("포함할 번호를 1~5개 선택하세요 (2개 선택됨)");
    expect(modeHint("manual", 3)).toBe("6개 번호를 직접 선택하세요 (3/6)");
  });
});
