import type { PicksSaveRequest } from "@fortuna-lottery/contract/picks";

/** 고른 번호를 요청으로 — 원본과 배열을 공유하지 않는다. 응답은 쓰지 않는다(저장이 낡게 한 목록을 다시 받는다) */
export function savePickRequest(numbers: readonly number[]): PicksSaveRequest {
  return { numbers: [...numbers] };
}
