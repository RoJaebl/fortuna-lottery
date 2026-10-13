import { describe, expect, it } from "vitest";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import type { DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { GetStatistics } from "./GetStatistics.js";

const draw = (round: number, numbers: number[], bonus: number): LotterietusDraw => ({
  round,
  numbers,
  bonus,
  drawnAt: "2026-01-01T00:00:00.000Z",
});

const history = (draws: LotterietusDraw[]): DrawHistoryPort => ({ findAll: async () => draws });

describe("GetStatistics", () => {
  it("totalDraws 와 latestRound 가 입력 회차와 같다", async () => {
    const stats = await new GetStatistics(
      history([
        draw(1, [1, 2, 3, 4, 5, 6], 7),
        draw(2, [10, 11, 12, 13, 14, 15], 16),
        draw(3, [20, 21, 22, 23, 24, 25], 26),
      ]),
    ).execute();
    expect(stats.totalDraws).toBe(3);
    expect(stats.latestRound).toBe(3);
    expect(stats.recentGrid.map((g) => g.round)).toEqual([1, 2, 3]);
  });

  it("회차가 0 개면 totalDraws 0 · latestRound 0 · 빈 격자로 답한다", async () => {
    const stats = await new GetStatistics(history([])).execute();
    expect(stats.totalDraws).toBe(0);
    expect(stats.latestRound).toBe(0);
    expect(stats.recentGrid).toEqual([]);
  });
});
