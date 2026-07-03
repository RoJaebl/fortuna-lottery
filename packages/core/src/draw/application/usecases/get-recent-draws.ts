import type { DrawResponse } from "../../dto/draw.dto";
import type { DrawDataPort } from "../ports/draw-data.port";

/** 최근 회차 조회 유스케이스 — 최신순으로 count개 반환 */
export const makeGetRecentDraws =
  (drawData: DrawDataPort) =>
  async (count: number): Promise<DrawResponse[]> => {
    const draws = await drawData.getAllDraws();
    return draws
      .slice(-Math.max(1, count))
      .reverse()
      .map((d) => ({
        round: d.round,
        numbers: [...d.numbers],
        bonus: d.bonus,
        drawnAt: d.drawnAt,
      }));
  };
