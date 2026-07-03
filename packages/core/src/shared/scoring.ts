import type { Combination } from "./combination";

/** 0 = 낙첨, 1~5 = 등수 */
export type Rank = 0 | 1 | 2 | 3 | 4 | 5;

export interface MatchResult {
  readonly matchedNumbers: readonly number[];
  readonly matchedCount: number;
  readonly bonusMatched: boolean;
  readonly rank: Rank;
}

/**
 * 조합을 한 회차 추첨 결과와 대조해 등수를 매긴다 (공식 규칙).
 * 6개=1등 · 5개+보너스=2등 · 5개=3등 · 4개=4등 · 3개=5등 · 그 외 낙첨.
 * simulation(백테스트)과 results(당첨 대조)가 공유하는 공통 도메인 함수.
 */
export function scoreAgainstDraw(
  combination: Combination,
  drawNumbers: readonly number[],
  bonus: number,
): MatchResult {
  const drawSet = new Set(drawNumbers);
  const matchedNumbers = combination.filter((n) => drawSet.has(n));
  const matchedCount = matchedNumbers.length;
  const bonusMatched = combination.includes(bonus);

  let rank: Rank = 0;
  if (matchedCount === 6) rank = 1;
  else if (matchedCount === 5 && bonusMatched) rank = 2;
  else if (matchedCount === 5) rank = 3;
  else if (matchedCount === 4) rank = 4;
  else if (matchedCount === 3) rank = 5;

  return { matchedNumbers, matchedCount, bonusMatched, rank };
}
