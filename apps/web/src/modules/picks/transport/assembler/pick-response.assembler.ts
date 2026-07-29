import type { PickResponse } from "@lotto-lab/core/picks/dto";
import type { PickModel } from "../../model/pick.model";

/** 응답 DTO → FE 모델 (와이어 이음새) */
export function assemblePick(dto: PickResponse): PickModel {
  return {
    id: dto.id,
    numbers: [...dto.numbers],
    createdAt: new Date(dto.createdAt),
  };
}
