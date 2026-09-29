import type { PicksListResponse } from "@fortuna-lottery/contract/picks";
import { PickModel } from "../../model/Pick.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 받는 값이 unknown 이라 여기서 한 번 좁힌다 */
export function listPicksResponse(res: unknown): PickModel[] {
  return (res as PicksListResponse).map((item) =>
    Object.assign(new PickModel(), {
      id: item.id,
      numbers: [...item.numbers],
      createdAt: new Date(item.createdAt),
    }),
  );
}
