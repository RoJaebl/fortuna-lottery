import type { LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import { LotterietusModel } from "../../model/Lotterietus.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 받는 값이 unknown 이라 여기서 한 번 좁힌다 */
export function getLotterietusStatusResponse(res: unknown): LotterietusModel {
  const dto = res as LotterietusStatusResponse;
  return Object.assign(new LotterietusModel(), {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
    nextRound: dto.nextRound,
    nextDrawAt: new Date(dto.nextDrawAt),
  });
}
