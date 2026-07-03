import type { SavePickRequest } from "@lotto-lab/core/picks/dto";

/** FE 모델 → 요청 DTO (와이어 이음새) */
export function mapSavePickRequest(numbers: number[]): SavePickRequest {
  return { numbers: [...numbers] };
}
