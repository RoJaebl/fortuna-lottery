import type { PicksSaveRequest } from "@fortuna-lottery/contract/picks";

/** FE 모델 → 요청 DTO (와이어 이음새) */
export function mapSavePickRequest(numbers: number[]): PicksSaveRequest {
  return { numbers: [...numbers] };
}
