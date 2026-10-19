import type { PicksListResponse } from "@fortuna-lottery/contract/picks";
import { PickModel } from "../_model/Pick.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 검증은 서버가 했고 여기는 계약 타입을 받아 옮기기만 한다 */
export function picksListResponse(res: PicksListResponse): PickModel[] {
  return res.map((item) =>
    Object.assign(new PickModel(), {
      id: item.id,
      numbers: [...item.numbers],
      createdAt: new Date(item.createdAt),
    }),
  );
}
