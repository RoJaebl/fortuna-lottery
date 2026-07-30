import { nextDrawAt } from "../../domain/schedule";
import type { LotterietusStatusResponse } from "../../dto/lotterietus.dto";
import type { DrawDataPort } from "../ports/draw-data.port";

/** 로또 현황 유스케이스 — 최근 회차 + 다음 추첨 정보를 getAllDraws 한 번으로 계산한다 */
export const makeGetLotterietusStatus =
  (drawData: DrawDataPort, clock: () => Date = () => new Date()) =>
  async (): Promise<LotterietusStatusResponse> => {
    const draws = await drawData.getAllDraws();
    const latest = draws[draws.length - 1];
    return {
      round: latest?.round ?? 0,
      numbers: latest ? [...latest.numbers] : [],
      bonus: latest?.bonus ?? 0,
      drawnAt: latest?.drawnAt ?? "",
      nextRound: (latest?.round ?? 0) + 1,
      nextDrawAt: nextDrawAt(clock()).toISOString(),
    };
  };
