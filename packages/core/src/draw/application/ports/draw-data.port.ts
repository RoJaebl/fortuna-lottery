import type { Draw } from "../../domain/draw";

/**
 * 회차 데이터 공급 포트 — 더미 ↔ 실데이터 교체의 유일한 이음새.
 * 반환 배열은 회차 오름차순을 보장한다 (마지막 원소 = 최신 회차).
 */
export interface DrawDataPort {
  getAllDraws(): Promise<readonly Draw[]>;
}
