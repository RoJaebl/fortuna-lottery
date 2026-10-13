import { describe, expect, it, vi } from "vitest";
import type { Draw } from "../domain/model/Draw.model.js";
import type { DrawDataPort } from "../domain/port/DrawDataPort.js";
import { GetLotterietusStatus } from "./GetLotterietusStatus.js";

const fakeDrawPort = (draws: Draw[]): DrawDataPort => ({
  getAllDraws: async () => draws,
});

describe("getLotterietusStatus (로또 현황)", () => {
  it("getAllDraws를 한 번만 호출해서 최근 회차 + 다음 추첨 정보를 함께 반환한다", async () => {
    const draws: Draw[] = [
      { round: 10, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      { round: 11, numbers: [10, 20, 30, 40, 41, 42], bonus: 43, drawnAt: "2026-07-04T11:35:00.000Z" },
    ];
    const getAllDraws = vi.fn(async () => draws);
    const getStatus = new GetLotterietusStatus(
      { getAllDraws },
      () => new Date("2026-07-01T00:00:00.000Z"),
    );

    const result = await getStatus.execute();

    expect(getAllDraws).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      latest: draws[1],
      nextRound: 12,
      nextDrawAt: new Date("2026-07-04T11:35:00.000Z"),
    });
  });

  it("회차 데이터가 없으면 최근 회차는 없고(null), 다음 회차는 1로 반환한다", async () => {
    const getStatus = new GetLotterietusStatus(
      fakeDrawPort([]),
      () => new Date("2026-07-01T00:00:00.000Z"),
    );

    const result = await getStatus.execute();

    expect(result).toEqual({
      latest: null,
      nextRound: 1,
      nextDrawAt: new Date("2026-07-04T11:35:00.000Z"),
    });
  });
});
