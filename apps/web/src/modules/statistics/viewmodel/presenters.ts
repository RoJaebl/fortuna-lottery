// 순수 presenter 함수 모음 — 프레임워크 무관, 단위 테스트 대상.
// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import type { StatisticsModel } from "../model/statistics.model";

/** 빈도 → 글로우 강도(0~1) 정규화 — 공 색은 바꾸지 않고 주변 강조만 */
export function glowIntensity(count: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return (count - min) / (max - min);
}

/** 조합 합계 */
export function sumOf(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/** 홀수 개수 */
export function oddCountOf(numbers: number[]): number {
  return numbers.filter((n) => n % 2 === 1).length;
}

/** 저구간(1~22) 개수 */
export function lowCountOf(numbers: number[]): number {
  return numbers.filter((n) => n <= 22).length;
}

/**
 * 패턴 희귀도 배지 — 내 조합의 홀짝 패턴이 과거 회차에서 차지한 비율 (사실 기반).
 * "희귀함"은 좋고 나쁨이 아니라 출현 빈도의 서술일 뿐이다.
 */
export function oddEvenRarity(
  myNumbers: number[],
  stats: StatisticsModel,
): { label: string; percent: number } {
  const odd = oddCountOf(myNumbers);
  const count = stats.oddCountDist[odd] ?? 0;
  const percent = stats.totalDraws > 0 ? (count / stats.totalDraws) * 100 : 0;
  return {
    label: `홀 ${odd} : 짝 ${6 - odd}`,
    percent: Math.round(percent * 10) / 10,
  };
}

/** 합계 분포에서 내 합계가 속한 위치 서술 (과거 회차 대비) */
export function sumPosition(
  myNumbers: number[],
  stats: StatisticsModel,
): { mySum: number; percentBelow: number } {
  const mySum = sumOf(myNumbers);
  let below = 0;
  let total = 0;
  for (const { sum, count } of stats.sumDistribution) {
    total += count;
    if (sum < mySum) below += count;
  }
  return {
    mySum,
    percentBelow: total > 0 ? Math.round((below / total) * 1000) / 10 : 0,
  };
}

/** 당첨 확률의 현실 체감 서술 — 고정 분모 기반 사실만 */
export function probabilityFacts(totalCombinations: number): string[] {
  const weeks = totalCombinations; // 매주 1게임 구매 가정
  const years = Math.round(weeks / 52.18);
  return [
    `한 게임이 1등일 확률은 1 / ${totalCombinations.toLocaleString()} 입니다.`,
    `매주 1게임씩 산다면, 평균적으로 1등까지 약 ${years.toLocaleString()}년이 걸리는 확률입니다.`,
    `이 확률은 어떤 번호를 고르든 완전히 동일합니다.`,
  ];
}

/** 핫/콜드 정렬 — gap 큰 순(콜드) / 작은 순(핫) 상위 n */
export function coldest(stats: StatisticsModel, n: number): StatisticsModel["hotCold"] {
  return [...stats.hotCold].sort((a, b) => b.gap - a.gap || a.number - b.number).slice(0, n);
}

export function hottest(stats: StatisticsModel, n: number): StatisticsModel["hotCold"] {
  return [...stats.hotCold].sort((a, b) => a.gap - b.gap || a.number - b.number).slice(0, n);
}
