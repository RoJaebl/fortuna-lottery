import type { PicksItem } from "@fortuna-lottery/contract/picks";

/** 사용자 한 사람이 저장한 픽 전부 — 누가 주는지는 모른다(조립 루트가 picks 의 facade 를 꽂는다) */
export interface PickSourcePort {
  listByUser: (userId: string) => Promise<PicksItem[]>;
}

export const PICK_SOURCE = Symbol("ResultsPickSourcePort");
