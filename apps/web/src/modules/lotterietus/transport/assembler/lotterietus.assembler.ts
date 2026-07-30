import type { LotterietusStatusResponse } from "@fortuna-lottery/core/lotterietus/dto";
import type { LotterietusModel } from "../../model/lotterietus.model";

/** 응답 DTO → FE 모델 (와이어 이음새) */
export function assembleLotterietusStatus(dto: LotterietusStatusResponse): LotterietusModel {
  return {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
    nextRound: dto.nextRound,
    nextDrawAt: new Date(dto.nextDrawAt),
  };
}
