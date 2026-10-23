import type { LotterietusReadResponse } from "@fortuna-lottery/contract/lotterietus";
import { LotterietusModel } from "../_model/Lotterietus.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 검증은 서버가 했고 여기는 계약 타입을 받아 옮기기만 한다 */
export function lotterietusReadResponse(res: LotterietusReadResponse): LotterietusModel {
  const dto = res;
  return Object.assign(new LotterietusModel(), {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
    nextRound: dto.nextRound,
    nextDrawAt: new Date(dto.nextDrawAt),
  });
}
