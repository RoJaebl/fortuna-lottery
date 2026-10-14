import { describe, expect, it } from "vitest";
import { EvaluationModel } from "../model/Evaluation.model";
import { hypothesisEvaluateRequest, hypothesisEvaluateResponse } from "./hypothesisEvaluate.mapper";

describe("hypothesisEvaluate 변환기", () => {
  it("요청은 topK 가 없으면 그 키를 빼고, 있으면 싣는다", () => {
    const request = hypothesisEvaluateRequest({ excludePastWinners: true });
    expect(request).toEqual({ excludePastWinners: true });
    expect("topK" in request).toBe(false);
    expect(hypothesisEvaluateRequest({ excludePastWinners: false, topK: 20 })).toEqual({
      excludePastWinners: false,
      topK: 20,
    });
  });

  it("응답을 도메인 원형으로 옮기고 배열을 원본과 공유하지 않는다", () => {
    const res = {
      totalCombinations: 8145060,
      assumedCombinations: 38760,
      pool: [1, 2, 3, 4, 5, 6],
      hitRate: { hits: 1, rounds: 2, expectedRate: 0.5 },
      backtest: {
        assumed: { tickets: 20, rankCounts: [20, 0, 0, 0, 0, 0] },
        random: { tickets: 20, rankCounts: [19, 0, 0, 0, 0, 1] },
      },
    };
    const model = hypothesisEvaluateResponse(res);

    expect(model).toBeInstanceOf(EvaluationModel);
    expect({ ...model }).toEqual(res);
    expect(model.pool).not.toBe(res.pool);
    expect(model.hitRate).not.toBe(res.hitRate);
    expect(model.backtest.assumed.rankCounts).not.toBe(res.backtest.assumed.rankCounts);
    expect(model.backtest.random.rankCounts).not.toBe(res.backtest.random.rankCounts);
  });
});
