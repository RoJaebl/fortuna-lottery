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
      round: 11,
      numbers: [10, 20, 30, 40, 41, 42],
      bonus: 43,
      drawnAt: "2026-07-04T11:35:00.000Z",
      nextRound: 12,
      nextDrawAt: "2026-07-04T11:35:00.000Z",
    });
  });

  it("회차 데이터가 없으면 회차 0/빈 번호로, 다음 회차는 1로 반환한다", async () => {
    const getStatus = new GetLotterietusStatus(
      fakeDrawPort([]),
      () => new Date("2026-07-01T00:00:00.000Z"),
    );

    const result = await getStatus.execute();

    expect(result).toEqual({
      round: 0,
      numbers: [],
      bonus: 0,
      drawnAt: "",
      nextRound: 1,
      nextDrawAt: "2026-07-04T11:35:00.000Z",
    });
  });
});
