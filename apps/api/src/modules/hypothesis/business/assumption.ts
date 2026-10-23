import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import { LOTTO_MAX, TOTAL_COMBINATIONS } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";

/** 앞선 회차가 이 수보다 적은 회차는 세지 않는다. */
export const WARMUP_ROUNDS = 100;

const ALL_NUMBERS = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1);

export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export function combinationKey(numbers: readonly number[]): string {
  return [...numbers].sort((a, b) => a - b).join(",");
}

/** 걸으며 누적하는 상태. counts[n] = 번호 n 의 본 번호 출현 횟수, pastWinners = 서로 다른 과거 1등 조합. */
interface Tally {
  readonly counts: number[];
  readonly pastWinners: Map<string, readonly number[]>;
}

const emptyTally = (): Tally => ({ counts: new Array<number>(LOTTO_MAX + 1).fill(0), pastWinners: new Map() });

function addDraw(tally: Tally, draw: Draw): void {
  for (const n of draw.numbers) tally.counts[n] = (tally.counts[n] ?? 0) + 1;
  tally.pastWinners.set(combinationKey(draw.numbers), draw.numbers);
}

function tallyOf(draws: readonly Draw[]): Tally {
  const tally = emptyTally();
  for (const draw of draws) addDraw(tally, draw);
  return tally;
}

function topFromCounts(counts: readonly number[], k: number): number[] {
  return [...ALL_NUMBERS]
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || a - b)
    .slice(0, k)
    .sort((a, b) => a - b);
}

// ponytail: topK 가정은 회차마다 과거 1등 전체를 훑는다(O(회차²)). 회차 수천 개까지는 충분하다.
function universe(assumption: Assumption, tally: Tally): { pool: number[]; count: number } {
  if (assumption.topK === null) {
    const excluded = assumption.excludePastWinners ? tally.pastWinners.size : 0;
    return { pool: [...ALL_NUMBERS], count: TOTAL_COMBINATIONS - excluded };
  }
  const pool = topFromCounts(tally.counts, assumption.topK);
  let excluded = 0;
  if (assumption.excludePastWinners) {
    const inPool = new Set(pool);
    for (const numbers of tally.pastWinners.values()) if (numbers.every((n) => inPool.has(n))) excluded++;
  }
  return { pool, count: binomial(assumption.topK, 6) - excluded };
}

export function topNumbers(draws: readonly Draw[], k: number): number[] {
  return topFromCounts(tallyOf(draws).counts, k);
}

/** 지금 데이터 전체 기준의 풀과 가정 우주 크기. */
export function assumedCombinations(assumption: Assumption, draws: readonly Draw[]): { pool: number[]; count: number } {
  return universe(assumption, tallyOf(draws));
}

/** draws(회차 오름차순)를 앞에서부터 걷는다. before 는 그 회차보다 앞선 회차로만 만든다. */
export function walkRounds(
  assumption: Assumption,
  draws: readonly Draw[],
  visit: (draw: Draw, before: { pool: number[]; pastKeys: ReadonlySet<string>; count: number }) => void,
): void {
  const tally = emptyTally();
  draws.forEach((draw, i) => {
    if (i >= WARMUP_ROUNDS) {
      const { pool, count } = universe(assumption, tally);
      visit(draw, { pool, pastKeys: new Set(tally.pastWinners.keys()), count });
    }
    addDraw(tally, draw);
  });
}

export function hitRate(
  assumption: Assumption,
  draws: readonly Draw[],
): { hits: number; rounds: number; expectedRate: number } {
  let hits = 0;
  let rounds = 0;
  let rateSum = 0;
  walkRounds(assumption, draws, (draw, before) => {
    rounds++;
    rateSum += before.count / TOTAL_COMBINATIONS;
    const inPool = new Set(before.pool);
    const hit =
      draw.numbers.every((n) => inPool.has(n)) &&
      !(assumption.excludePastWinners && before.pastKeys.has(combinationKey(draw.numbers)));
    if (hit) hits++;
  });
  return { hits, rounds, expectedRate: rounds === 0 ? 0 : rateSum / rounds };
}
