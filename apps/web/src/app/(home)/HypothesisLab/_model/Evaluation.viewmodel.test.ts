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
      sumRange: { min: 121, max: 160 },
      sumRangeCombinations: { total: 38767, excluded: 7 },
      theoryRate: 0.485,
      pastRate: 0.47,
      expectedHits: 552.6,
      denominators: { past: 8403746, theory: 8145060 },
      sumCounts: [],
      frequentBands: [],
      maxWindowRate: 0.1,
      emptyBands: [],
      numbers: [],
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

  it("합계 구간 문구", () => {
    const e = evaluation({
      hitRate: { hits: 585, rounds: 1245, expectedRate: 0.485 },
      expectedHits: 581.4,
      assumedCombinations: 3948748,
      sumRangeCombinations: { total: 3948755, excluded: 7 },
    });
    expect(e.pastRateLabel).toBe("47.0% · 1,245회 중 585회");
    expect(e.theoryRateLabel).toBe("48.5%");
    expect(e.inRangeLabel).toBe("1 / 3,948,748");
    expect(e.pastProbabilityLabel).toBe("1 / 8,403,746");
    expect(e.theoryProbabilityLabel).toBe("1 / 8,145,060");
    expect(e.excludedLabel).toBe("제외한 과거 1등 7개");
    expect(e.gapSentence).toBe("과거에 기대(약 581회)보다 4회 더 나왔습니다. 이 차이는 우연입니다.");
  });

  it("합계 구간 문구의 가장자리 — 센 회차 없음, 과거 확률 없음, 차이 0, 덜 나옴", () => {
    const none = evaluation({ hitRate: { hits: 0, rounds: 0, expectedRate: 0 }, denominators: { past: null, theory: 8145060 } });
    expect(none.pastRateLabel).toBe("센 회차 없음");
    expect(none.pastProbabilityLabel).toBe("과거에 든 회차 없음");
    expect(evaluation({ expectedHits: 12 }).gapSentence).toBe("기대와 같았습니다.");
    expect(evaluation({ expectedHits: 20 }).gapSentence).toBe("과거에 기대(약 20회)보다 8회 덜 나왔습니다. 이 차이는 우연입니다.");
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
