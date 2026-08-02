import type { Draw } from "../../domain/draw";

/** 추첨 결과 영속화 포트 — 수집(워커) 전용 */
export interface DrawWriterPort {
  /** 저장된 최대 회차. 저장된 것이 없으면 0 */
  getMaxRound(): Promise<number>;
  /** 회차 기준 멱등 저장 — 이미 있는 회차는 갱신한다 */
  upsertDraws(draws: readonly Draw[]): Promise<void>;
}
