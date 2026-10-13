import { describe, expect, it } from "vitest";
import { EvaluationModel } from "./Evaluation.model";
import { EvaluationViewModel } from "./Evaluation.viewmodel";

const evaluation = (over: Partial<EvaluationModel>) =>
  EvaluationViewModel.from(
    Object.assign(new EvaluationModel(), {
      totalCombinations: 8145060,
      assumedCombinations: 38760,
      pool: [1, 2, 3, 4, 5, 6],
      hitRate: { hits: 12, rounds: 1090, expectedRate: 0.0048 },
      backtest: {
        assumed: { tickets: 20, rankCounts: [18, 0, 0, 0, 1, 1] },
        random: { tickets: 20, rankCounts: [19, 0, 0, 0, 0, 1] },
      },
      ...over,
    }),
  );

describe("EvaluationViewModel (가정 평가 결과 하나로 정해지는 문구)", () => {
  it("assumedProbabilityLabel — 남은 조합이 없으면 남은 조합 없음", () => {
    expect(evaluation({}).assumedProbabilityLabel).toBe("1 / 38,760");
    expect(evaluation({ assumedCombinations: 0 }).assumedProbabilityLabel).toBe("남은 조합 없음");
  });

  it("realProbabilityLabel 은 전체 조합 수로", () => {
    expect(evaluation({}).realProbabilityLabel).toBe("1 / 8,145,060");
  });

  it("hitRateLabel — 센 회차가 없으면 0 으로 나누지 않는다", () => {
    expect(evaluation({}).hitRateLabel).toBe("12 / 1,090회차 (1.1%)");
    expect(evaluation({ hitRate: { hits: 0, rounds: 0, expectedRate: 0.0048 } }).hitRateLabel).toBe("센 회차 없음");
  });

  it("expectedRateLabel", () => {
    expect(evaluation({}).expectedRateLabel).toBe("무작위라면 0.5%");
  });

  it("backtestRows — 등수 1~5 마다 가정·무작위", () => {
    expect(evaluation({}).backtestRows).toEqual([
      { label: "1등", assumed: 0, random: 0 },
      { label: "2등", assumed: 0, random: 0 },
      { label: "3등", assumed: 0, random: 0 },
      { label: "4등", assumed: 1, random: 0 },
      { label: "5등", assumed: 1, random: 1 },
    ]);
  });
});
