import { describe, expect, it } from "vitest";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import type { DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { BacktestCombination } from "./BacktestCombination.js";

const draw = (round: number, numbers: number[], bonus: number): LotterietusDraw => ({
  round,
  numbers,
  bonus,
  drawnAt: "2026-01-01T00:00:00.000Z",
});

const history = (draws: LotterietusDraw[]): DrawHistoryPort => ({ findAll: async () => draws });

describe("BacktestCombination", () => {
  it("6 개 중복 없는 조합이면 회차 수만큼 비교한 결과를 낸다", async () => {
    const useCase = new BacktestCombination(
      history([
        draw(1, [1, 2, 3, 4, 5, 6], 7),
        draw(2, [10, 11, 12, 13, 14, 15], 16),
        draw(3, [20, 21, 22, 23, 24, 25], 26),
      ]),
    );
    const result = await useCase.execute({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalDraws).toBe(3);
    expect(result.value.rankCounts.reduce((a, b) => a + b, 0)).toBe(3);
    expect(result.value.rankCounts[1]).toBe(1);
    expect(result.value.wins).toEqual([{ round: 1, rank: 1, matchedCount: 6 }]);
  });

  it("중복 번호면 ok: false 와 도메인 메시지를 낸다", async () => {
    const useCase = new BacktestCombination(history([draw(1, [1, 2, 3, 4, 5, 6], 7)]));
    const result = await useCase.execute({ numbers: [1, 1, 3, 4, 5, 6] });
    expect(result).toEqual({ ok: false, error: "중복된 번호가 있습니다" });
  });
});
