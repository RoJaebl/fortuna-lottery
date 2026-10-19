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

  it("backtestCaption — 회차 합계 장수를 총계로 말한다", () => {
    const e = evaluation({ backtest: { assumed: { tickets: 21800, rankCounts: [] }, random: { tickets: 21800, rankCounts: [] } } });
    expect(e.backtestCaption).toBe("백테스트 — 총 가정 21,800장 · 무작위 21,800장 (회차마다 20장)");
  });

  it("firstPrizeNote — 1등 칸 대신 세 확률을 가리킨다", () => {
    expect(evaluation({}).firstPrizeNote).toBe("1등은 이 장수로는 사실상 나오지 않습니다. 위의 세 확률을 보세요.");
  });

  it("backtestRows — 등수 2~5 마다 (1등은 표에 없다) 가정·무작위", () => {
    expect(evaluation({}).backtestRows).toEqual([
      { label: "2등", assumed: 0, random: 0 },
      { label: "3등", assumed: 0, random: 0 },
      { label: "4등", assumed: 1, random: 0 },
      { label: "5등", assumed: 1, random: 1 },
    ]);
  });
});
