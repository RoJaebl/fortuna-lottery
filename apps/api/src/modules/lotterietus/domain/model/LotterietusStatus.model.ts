import type { Draw } from "./Draw.model.js";

/** 로또 현황 — 최근 회차(없으면 null)와 다음 추첨. 계약 모양으로 옮기는 일은 facade 가 한다 */
export interface LotterietusStatus {
  readonly latest: Draw | null;
  readonly nextRound: number;
  readonly nextDrawAt: Date;
}
