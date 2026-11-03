import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import { LOTTO_MAX, SUM_MAX, SUM_MIN } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { sumOf } from "./assumption.js";
import { remainingCount } from "./drawAssumed.js";

/** 많이 든 구간으로 치는 기준 — 창 가운데 최댓값의 이 비율 이상. */
const FREQUENT_RATIO = 0.9;

export interface FrequentBand {
  readonly min: number;
  readonly max: number;
  readonly count: number;
  readonly rate: number;
}

/** counts[i] = 합이 SUM_MIN + i 인 회차 수. 길이 SUM_MAX - SUM_MIN + 1 = 235. */
export function sumCounts(draws: readonly Draw[]): number[] {
  const counts = new Array<number>(SUM_MAX - SUM_MIN + 1).fill(0);
  for (const draw of draws) {
    const i = sumOf(draw.numbers) - SUM_MIN;
    if (i >= 0 && i < counts.length) counts[i]!++;
  }
  return counts;
}

/** 폭 width 창마다 든 회차 수를 세어 많이 든 구간과 한 번도 안 나온 빈 구간을 낸다. */
export function sumBands(
  counts: readonly number[],
  width: number,
  rounds: number,
): { frequentBands: FrequentBand[]; maxWindowRate: number; emptyBands: { min: number; max: number }[] } {
  // 창 [s, s+width-1] 의 회차 수는 누적합의 차로 구한다.
  const prefix = [0];
  for (const c of counts) prefix.push(prefix[prefix.length - 1]! + c);
  const windows: { min: number; max: number; count: number }[] = [];
  for (let s = SUM_MIN; s + width - 1 <= SUM_MAX; s++) {
    const lo = s - SUM_MIN;
    windows.push({ min: s, max: s + width - 1, count: prefix[lo + width]! - prefix[lo]! });
  }
  const top = windows.reduce((m, w) => Math.max(m, w.count), 0);

  const merged: { min: number; max: number; count: number }[] = [];
  if (rounds > 0 && top > 0) {
    for (const w of windows) {
      if (w.count < FREQUENT_RATIO * top) continue;
      const last = merged[merged.length - 1];
      if (last !== undefined && w.min <= last.max + 1) {
        last.max = Math.max(last.max, w.max);
        last.count = Math.max(last.count, w.count);
      } else merged.push({ ...w });
    }
  }
  const frequentBands = merged.map((b) => ({ ...b, rate: b.count / rounds }));

  const emptyBands: { min: number; max: number }[] = [];
  let runStart = -1;
  for (let i = 0; i <= counts.length; i++) {
    const empty = i < counts.length && counts[i] === 0;
    if (empty && runStart < 0) runStart = i;
    if (!empty && runStart >= 0) {
      if (i - runStart >= width) emptyBands.push({ min: SUM_MIN + runStart, max: SUM_MIN + i - 1 });
      runStart = -1;
    }
  }

  return { frequentBands, maxWindowRate: rounds === 0 ? 0 : top / rounds, emptyBands };
}

/**
 * 번호판 — 1~45 마다 「가정 우주에 이 번호를 품은 조합이 남아 있는가」와
 * 「합이 구간인 회차에서 이 번호가 나온 횟수」. 풀 밖 번호는 고른 번호여도 불가능이다(spec §5.2).
 */
export function numberBoard(
  draws: readonly Draw[],
  assumption: Assumption,
  pool: readonly number[],
  pastKeys: ReadonlySet<string>,
): { n: number; possible: boolean; count: number }[] {
  const { fixed, sumRange } = assumption;
  const counts = new Array<number>(LOTTO_MAX + 1).fill(0);
  for (const { numbers } of draws) {
    const s = sumOf(numbers);
    if (s >= sumRange.min && s <= sumRange.max) for (const n of numbers) counts[n]!++;
  }
  const inPool = new Set(pool);
  // remainingCount 는 넘겨받은 과거 1등을 늘 뺀다 — 제외를 끄면 빈 집합을 넘긴다.
  const past = assumption.excludePastWinners ? pastKeys : new Set<string>();
  return Array.from({ length: LOTTO_MAX }, (_, i) => {
    const n = i + 1;
    const possible =
      inPool.has(n) &&
      // fixed 가 이미 6개면 번호를 더 품을 수 없다(remainingCount 는 6 - 길이 개를 고른다).
      (fixed.includes(n) || (fixed.length < 6 && remainingCount([...fixed, n], sumRange, pool, past) > 0));
    return { n, possible, count: counts[n]! };
  });
}
