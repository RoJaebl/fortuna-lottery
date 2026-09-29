import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";

/**
 * 과거 회차 전부 — 회차 오름차순(마지막 원소 = 최신 회차). 누가 주는지는 모른다(조립 루트가 lotterietus 의 facade 를 꽂는다).
 * statistics 도 같은 모양의 포트를 자기 안에 따로 둔다 — 모듈끼리 서로의 파일을 보지 않는다.
 */
export interface DrawHistoryPort {
  findAll: () => Promise<LotterietusDraw[]>;
}

export const DRAW_HISTORY = Symbol("SimulationDrawHistoryPort");
