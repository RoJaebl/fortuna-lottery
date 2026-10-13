import { describe, expect, it } from "vitest";
import { assumptionRequest } from "./HypothesisLab.presenter";

describe("assumptionRequest", () => {
  it("K 스위치가 꺼져 있으면 topK 를 싣지 않는다", () => {
    expect(assumptionRequest(true, false, 20)).toEqual({ excludePastWinners: true });
    expect(assumptionRequest(false, true, 6)).toEqual({ excludePastWinners: false, topK: 6 });
  });
});
