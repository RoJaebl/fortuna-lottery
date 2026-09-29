import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import type { PicksItem } from "@fortuna-lottery/contract/picks";
import { describe, expect, it } from "vitest";
import { ResultsCheckContext } from "../context/ResultsCheckContext.js";
import type { DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import type { PickSourcePort } from "../domain/port/PickSourcePort.js";
import { CheckResults } from "./CheckResults.js";

// 옛 시험은 picks 의 인메모리 저장소를 직접 가져왔다 — 이제 results 는 자기 포트로만 받으므로 가짜 포트를 끼운다. 단언은 그대로다
const fakeDrawPort = (draws: LotterietusDraw[]): DrawHistoryPort => ({
  async findAll() {
    return draws;
  },
});

const fakePickSource = (owned: Record<string, PicksItem[]> = {}): PickSourcePort => ({
  async listByUser(userId) {
    return owned[userId] ?? [];
  },
});

const makeCheckResults = (pickSource: PickSourcePort, drawPort: DrawHistoryPort) =>
  new CheckResults(new ResultsCheckContext(pickSource, drawPort));

describe("checkResults (당첨 대조)", () => {
  it("저장된 픽을 최신 회차와 대조해 채점한다", async () => {
    const repo = fakePickSource({
      guest: [{ id: "p1", numbers: [1, 2, 3, 40, 41, 42], createdAt: "2026-07-01T00:00:00.000Z" }],
    });
    const checkResults = makeCheckResults(
      repo,
      fakeDrawPort([
        { round: 1, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2026-06-20T11:35:00.000Z" },
        { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      ]),
    );

    const res = await checkResults.execute("guest");
    expect(res.draw?.round).toBe(2); // 최신 회차 기준
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.matchedNumbers).toEqual([1, 2, 3]);
    expect(res.items[0]?.rank).toBe(5);
  });

  it("회차 데이터가 없으면 빈 결과", async () => {
    const checkResults = makeCheckResults(fakePickSource(), fakeDrawPort([]));
    expect(await checkResults.execute("guest")).toEqual({ draw: null, items: [] });
  });
});
