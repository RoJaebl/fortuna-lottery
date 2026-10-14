import { describe, expect, it } from "vitest";
import { HypothesisEvaluateRequestSchema, HypothesisPopularityResponseSchema } from "./schema.js";

const evalOk = (v: unknown) => HypothesisEvaluateRequestSchema.safeParse(v).success;

describe("HypothesisEvaluateRequestSchema", () => {
  it("topK 없이 받는다", () => {
    expect(evalOk({ excludePastWinners: true })).toBe(true);
  });
  it("topK 20 을 받는다", () => {
    expect(evalOk({ excludePastWinners: false, topK: 20 })).toBe(true);
  });
  it("범위 밖이거나 정수가 아닌 topK 를 거절한다", () => {
    for (const topK of [5, 46, 20.5]) expect(evalOk({ excludePastWinners: true, topK })).toBe(false);
  });
  it("excludePastWinners 가 없으면 거절한다", () => {
    expect(evalOk({ topK: 20 })).toBe(false);
  });
});

describe("HypothesisPopularityResponseSchema", () => {
  it("모르는 패턴을 거절한다", () => {
    expect(HypothesisPopularityResponseSchema.safeParse({ patterns: ["lucky"] }).success).toBe(false);
  });
});
