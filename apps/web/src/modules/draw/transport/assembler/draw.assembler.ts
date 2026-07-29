import type { DrawResponse } from "@fortuna-lottery/core/draw/dto";
import type { DrawModel } from "../../model/draw.model";

/** 응답 DTO → FE 모델 (와이어 이음새) */
export function assembleDraw(dto: DrawResponse): DrawModel {
  return {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
  };
}
