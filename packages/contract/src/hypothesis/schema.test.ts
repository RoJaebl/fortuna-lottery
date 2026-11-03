import { describe, expect, it } from "vitest";
import {
  HypothesisEvaluateRequestSchema,
  HypothesisEvaluateResponseSchema,
  HypothesisPopularityResponseSchema,
} from "./schema.js";

const sumRange = { min: 100, max: 150 };
const evalOk = (v: unknown) => HypothesisEvaluateRequestSchema.safeParse(v).success;

describe("HypothesisEvaluateRequestSchema", () => {
  it("topK 없이 받는다", () => {
    expect(evalOk({ sumRange, excludePastWinners: true })).toBe(true);
  });
  it("topK 20 을 받는다", () => {
    expect(evalOk({ sumRange, excludePastWinners: false, topK: 20 })).toBe(true);
  });
  it("범위 밖이거나 정수가 아닌 topK 를 거절한다", () => {
    for (const topK of [5, 46, 20.5]) expect(evalOk({ sumRange, excludePastWinners: true, topK })).toBe(false);
  });
  it("excludePastWinners 가 없으면 거절한다", () => {
    expect(evalOk({ topK: 20 })).toBe(false);
  });
});

describe("합계 구간 가정", () => {
  const base = { excludePastWinners: false };
  it("범위 밖이거나 정수가 아닌 합계 구간·없는 sumRange 를 거절한다", () => {
    for (const r of [{ min: 20, max: 100 }, { min: 100, max: 256 }, { min: 1.5, max: 100 }, { min: 100 }])
      expect(evalOk({ ...base, sumRange: r })).toBe(false);
    expect(evalOk(base)).toBe(false);
  });
  it("min > max 는 모양만 보므로 받는다", () => {
    expect(evalOk({ ...base, sumRange: { min: 150, max: 100 } })).toBe(true);
  });
  it("fixed 6개를 거절하고 5개는 받는다", () => {
    expect(evalOk({ ...base, sumRange, fixed: [1, 2, 3, 4, 5, 6] })).toBe(false);
    expect(evalOk({ ...base, sumRange, fixed: [1, 2, 3, 4, 5] })).toBe(true);
    expect(evalOk({ ...base, sumRange, fixed: [0] })).toBe(false);
  });
  it("fixed 를 생략하면 [] 로 채운다", () => {
    const r = HypothesisEvaluateRequestSchema.parse({ ...base, sumRange });
    expect(r.fixed).toEqual([]);
  });
  it("untilRound 0 을 거절하고 1 은 받는다", () => {
    expect(evalOk({ ...base, sumRange, untilRound: 0 })).toBe(false);
    expect(evalOk({ ...base, sumRange, untilRound: 1 })).toBe(true);
  });
});

describe("HypothesisEvaluateResponseSchema", () => {
  const tally = { tickets: 0, rankCounts: [0, 0, 0, 0, 0, 0] };
  const res = {
    totalCombinations: 8145060,
    assumedCombinations: 10,
    pool: [1, 2],
    hitRate: { hits: 0, rounds: 0, expectedRate: 0 },
    backtest: { assumed: tally, random: tally },
    sumRange: { min: 21, max: 21 },
    sumRangeCombinations: { total: 1, excluded: 0 },
    theoryRate: 0,
    pastRate: 0,
    expectedHits: 0,
    denominators: { past: null, theory: 8145060 },
    sumCounts: [],
    frequentBands: [{ min: 1, max: 2, count: 3, rate: 0.5 }],
    maxWindowRate: 0,
    emptyBands: [{ min: 1, max: 2 }],
    numbers: [{ n: 1, possible: true, count: 0 }],
  };
  it("과거 분모 null 을 받는다", () => {
    expect(HypothesisEvaluateResponseSchema.safeParse(res).success).toBe(true);
  });
  it("늘어난 필드가 없으면 거절한다", () => {
    const { numbers: _n, ...rest } = res;
    expect(HypothesisEvaluateResponseSchema.safeParse(rest).success).toBe(false);
  });
});

describe("HypothesisPopularityResponseSchema", () => {
  it("모르는 패턴을 거절한다", () => {
    expect(HypothesisPopularityResponseSchema.safeParse({ patterns: ["lucky"] }).success).toBe(false);
  });
});
