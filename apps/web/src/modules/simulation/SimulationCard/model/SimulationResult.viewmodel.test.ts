import { describe, expect, it } from "vitest";
import { SimulationResultModel } from "./SimulationResult.model";
import { SimulationResultViewModel } from "./SimulationResult.viewmodel";

const result = (over: Partial<SimulationResultModel>) =>
  SimulationResultViewModel.from(
    Object.assign(new SimulationResultModel(), { totalDraws: 1200, rankCounts: [0, 0, 0, 0, 0, 0], wins: [], ...over }),
  );

describe("SimulationResultViewModel (백테스트 결과 하나로 정해지는 요약)", () => {
  it("summaryLine — 당첨이 없으면 없었다고, 있으면 몇 번이었는지", () => {
    expect(result({}).summaryLine).toBe("전 1,200회차에서 5등 이상 당첨이 없었습니다.");
    expect(result({ wins: [{ round: 3, rank: 5, matchedCount: 3 }] }).summaryLine).toBe(
      "전 1,200회차 중 1번 당첨되었을 조합입니다 (5등 이상).",
    );
  });

  it("rankRows — 당첨 있는 등수만, 1·2등은 강조", () => {
    expect(result({ rankCounts: [1150, 1, 1, 0, 3, 46] }).rankRows).toEqual([
      { rank: 1, label: "1등", count: 1, emphasized: true },
      { rank: 2, label: "2등", count: 1, emphasized: true },
      { rank: 4, label: "4등", count: 3, emphasized: false },
      { rank: 5, label: "5등", count: 46, emphasized: false },
    ]);
  });
});
