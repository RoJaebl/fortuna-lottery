import type { PicksCreateRequest, PicksCreateResponse } from "@fortuna-lottery/contract/picks";
import type { PickModel } from "../_model/Pick.model";
import { picksListResponse } from "./picksList.mapper";

/** 고른 번호를 요청으로 — 원본과 배열을 공유하지 않는다 */
export function picksCreateRequest(numbers: readonly number[]): PicksCreateRequest {
  return { numbers: [...numbers] };
}

/** 저장 응답(저장된 픽 하나)을 원형으로 — 목록 항목과 모양이 같아 목록 변환기에 맡긴다 */
export function picksCreateResponse(res: PicksCreateResponse): PickModel {
  return picksListResponse([res])[0]!;
}
