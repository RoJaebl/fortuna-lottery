/**
 * 통계 — 회차로부터 순수 계산되는 비영속 파생 데이터(옛 StatisticsReadModel).
 * DB 테이블이 없으며, business/GetStatistics 가 계산하고 facade 가 계약 모양으로 옮긴다.
 */
export interface Statistics {
  readonly totalDraws: number;
  readonly latestRound: number;
  /** index 0 = 번호 1 */
  readonly frequency: readonly number[];
  readonly sumDistribution: readonly { sum: number; count: number }[];
  /** index = 홀수 개수 0~6 */
  readonly oddCountDist: readonly number[];
  /** index = 저구간(1~22) 개수 0~6 */
  readonly lowCountDist: readonly number[];
  /** 구간(1-10·11-20·21-30·31-40·41-45)별 총 출현 */
  readonly zoneCounts: readonly number[];
  readonly hotCold: readonly { number: number; count: number; gap: number }[];
  readonly topPairs: readonly { a: number; b: number; count: number }[];
  /** 잔디밭 시각화용 최근 회차 (오름차순) */
  readonly recentGrid: readonly { round: number; numbers: readonly number[] }[];
  /** 6/45 전체 조합 수 — 당첨 확률 시각화의 고정 분모 (정직성 장치) */
  readonly totalCombinations: number;
}
