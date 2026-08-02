import type { Draw } from "../../domain/draw";

/**
 * 원격 추첨 결과 조회 포트 — 수집(워커) 전용.
 *
 * 구현체는 지정한 회차 근방의 회차 묶음을 반환한다. 반환 순서는 보장하지 않으며
 * (유스케이스가 정렬한다), 요청한 회차가 **아직 존재하지 않으면 빈 배열**을 반환해야 한다.
 * 이 "빈 배열" 규약이 IngestDraws의 종료 조건이다.
 */
export interface DrawSourcePort {
  fetchBatch(centerRound: number): Promise<readonly Draw[]>;
}
