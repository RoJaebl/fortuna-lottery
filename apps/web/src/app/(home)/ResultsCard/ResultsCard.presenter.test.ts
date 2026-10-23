import { describe, expect, it } from "vitest";
import { resultsSubtitle } from "./ResultsCard.presenter";

describe("ResultsCard 표시 조정자", () => {
  it("resultsSubtitle — 기준 회차가 있으면 그 회차를, 없으면 안내 문구를", () => {
    expect(resultsSubtitle(1234)).toBe("제1234회 당첨 번호와 대조");
    expect(resultsSubtitle(null)).toBe("저장한 번호를 최신 회차와 대조합니다");
  });
});
