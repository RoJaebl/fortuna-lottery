import { describe, expect, it, vi } from "vitest";
import type { Draw } from "../domain/model/Draw.model.js";
import { ListDraws } from "./ListDraws.js";

describe("ListDraws (과거 회차 전부)", () => {
  it("포트가 준 회차를 오름차순 그대로 돌려준다", async () => {
    const draws: Draw[] = [
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2002-12-07T11:35:00.000Z" },
      { round: 2, numbers: [10, 20, 30, 40, 41, 42], bonus: 43, drawnAt: "2002-12-14T11:35:00.000Z" },
    ];
    const getAllDraws = vi.fn(async () => draws);
    const listDraws = new ListDraws({ getAllDraws });

    expect(await listDraws.execute()).toEqual(draws);
    expect(getAllDraws).toHaveBeenCalledTimes(1);
  });

  it("회차가 없으면 빈 배열이다", async () => {
    const listDraws = new ListDraws({ getAllDraws: async () => [] });

    expect(await listDraws.execute()).toEqual([]);
  });
});
