/**
 * 통계 Read-Model — draws로부터 순수 계산되는 비영속 파생 데이터.
 * DB 테이블이 없으며(도메인 단일 책임 규칙의 예외 아님), 백엔드가 계산해 DTO로 제공한다.
 */
export interface StatisticsReadModel {
  totalDraws: number;
  latestRound: number;
  /** index 0 = 번호 1 */
  frequency: number[];
  sumDistribution: { sum: number; count: number }[];
  /** index = 홀수 개수 0~6 */
  oddCountDist: number[];
  /** index = 저구간(1~22) 개수 0~6 */
  lowCountDist: number[];
  /** 구간(1-10·11-20·21-30·31-40·41-45)별 총 출현 */
  zoneCounts: number[];
  hotCold: { number: number; count: number; gap: number }[];
  topPairs: { a: number; b: number; count: number }[];
  /** 잔디밭 시각화용 최근 회차 (오름차순) */
  recentGrid: { round: number; numbers: number[] }[];
}
