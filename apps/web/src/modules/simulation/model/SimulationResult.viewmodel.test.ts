import { describe, expect, it } from "vitest";
import { SimulationResultModel } from "./SimulationResult.model";
import { SimulationResultViewModel } from "./SimulationResult.viewmodel";

const result = (over: Partial<SimulationResultModel>) =>
  SimulationResultViewModel.from(
    Object.assign(new SimulationResultModel(), { totalDraws: 1200, rankCounts: [0, 0, 0, 0, 0, 0], wins: [], ...over }),
  );

describe("SimulationResultViewModel (백테스트 결과 하나로 정해지는 요약)", () => {
  it("summarizeRanks — 당첨이 있는 등수만 라벨과 함께", () => {
    expect(result({ rankCounts: [1150, 0, 1, 0, 3, 46] }).summarizeRanks).toEqual([
      { rank: 2, label: "2등", count: 1 },
      { rank: 4, label: "4등", count: 3 },
      { rank: 5, label: "5등", count: 46 },
    ]);
  });

  it("summaryLine — 당첨이 없으면 없었다고, 있으면 몇 번이었는지", () => {
    expect(result({}).summaryLine).toBe("전 1,200회차에서 5등 이상 당첨이 없었습니다.");
    expect(result({ wins: [{ round: 3, rank: 5, matchedCount: 3 }] }).summaryLine).toBe(
      "전 1,200회차 중 1번 당첨되었을 조합입니다 (5등 이상).",
    );
  });
});
