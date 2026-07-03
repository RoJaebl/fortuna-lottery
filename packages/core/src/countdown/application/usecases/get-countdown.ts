import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
import { nextDrawAt } from "../../domain/schedule";
import type { CountdownResponse } from "../../dto/countdown.dto";

/** 다음 추첨 정보 유스케이스 — 다음 추첨 시각 + 다음 회차 번호 */
export const makeGetCountdown =
  (drawData: DrawDataPort, clock: () => Date = () => new Date()) =>
  async (): Promise<CountdownResponse> => {
    const draws = await drawData.getAllDraws();
    const latestRound = draws[draws.length - 1]?.round ?? 0;
    return {
      nextDrawAt: nextDrawAt(clock()).toISOString(),
      nextRound: latestRound + 1,
    };
  };
