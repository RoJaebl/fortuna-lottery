/** 한 회차 추첨 결과 — 사용자와 완전히 무관한 도메인 데이터 (DrawDataPort로만 공급) */
export interface Draw {
  readonly round: number;
  /** 당첨 번호 6개 (오름차순) */
  readonly numbers: readonly number[];
  readonly bonus: number;
  /** 추첨 시각 ISO 문자열 */
  readonly drawnAt: string;
}
