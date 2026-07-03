import { describe, expect, it } from "vitest";
import type { Draw } from "../../../draw/domain/draw";
import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
import { createInMemoryPickRepository } from "../../../picks/infrastructure/adapters/in-memory-pick.repository";
import { makeCheckResults } from "./check-results";

const fakeDrawPort = (draws: Draw[]): DrawDataPort => ({
  async getAllDraws() {
    return draws;
  },
});

describe("checkResults (당첨 대조)", () => {
  it("저장된 픽을 최신 회차와 대조해 채점한다", async () => {
    const repo = createInMemoryPickRepository();
    await repo.save({
      id: "p1",
      userId: "guest",
      numbers: [1, 2, 3, 40, 41, 42],
      createdAt: "2026-07-01T00:00:00.000Z",
    });
    const checkResults = makeCheckResults(
      repo,
      fakeDrawPort([
        { round: 1, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2026-06-20T11:35:00.000Z" },
        { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      ]),
    );

    const res = await checkResults("guest");
    expect(res.draw?.round).toBe(2); // 최신 회차 기준
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.matchedNumbers).toEqual([1, 2, 3]);
    expect(res.items[0]?.rank).toBe(5);
  });

  it("회차 데이터가 없으면 빈 결과", async () => {
    const checkResults = makeCheckResults(createInMemoryPickRepository(), fakeDrawPort([]));
    expect(await checkResults("guest")).toEqual({ draw: null, items: [] });
  });
});
