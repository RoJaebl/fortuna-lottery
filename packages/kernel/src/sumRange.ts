import {
  createCombination,
  LOTTO_MAX,
  LOTTO_MIN,
  LOTTO_PICK_COUNT,
  type Combination,
} from "./combination.js";
import { err, type Result } from "./result.js";
import type { RandomPort } from "./rng.js";

/** 6개 합의 가능한 범위 (1+2+3+4+5+6 ~ 40+…+45) */
export const SUM_MIN = 21;
export const SUM_MAX = 255;

/** ways[i][k][s] = pool[i..] 에서 k개를 골라 합이 s 이하인 경우의 수(누적합) */
type Ways = number[][][];

// 백테스트처럼 같은 풀로 잇달아 부르는 자리를 위해 마지막 표 하나만 기억한다.
let lastWays = { key: "", ways: [] as Ways };
function buildWays(pool: readonly number[], maxPick: number): Ways {
  const key = `${maxPick}|${pool.join(",")}`;
  if (lastWays.key !== key) lastWays = { key, ways: buildCumulative(pool, maxPick) };
  return lastWays.ways;
}

function buildCumulative(pool: readonly number[], maxPick: number): Ways {
  const ways: Ways = Array.from({ length: pool.length + 1 }, () =>
    Array.from({ length: maxPick + 1 }, () => new Array<number>(SUM_MAX + 1).fill(0)),
  );
  ways[pool.length]![0]![0] = 1;
  for (let i = pool.length - 1; i >= 0; i -= 1) {
    const v = pool[i] as number;
    for (let k = 0; k <= maxPick; k += 1) {
      for (let s = 0; s <= SUM_MAX; s += 1) {
        let c = ways[i + 1]![k]![s]!;
        if (k > 0 && s >= v) c += ways[i + 1]![k - 1]![s - v]!;
        ways[i]![k]![s] = c;
      }
    }
  }
  for (const row of ways) for (const sums of row) for (let s = 1; s <= SUM_MAX; s += 1) sums[s]! += sums[s - 1]!;
  return ways;
}

function inRange(ways: Ways, i: number, k: number, lo: number, hi: number): number {
  const from = Math.max(lo, 0);
  const to = Math.min(hi, SUM_MAX);
  if (from > to) return 0;
  const sums = ways[i]![k]!;
  return sums[to]! - (from > 0 ? sums[from - 1]! : 0);
}

/** pool 에서 pick 개를 골라 합이 [min,max] 인 조합의 수 */
export function countInSumRange(
  pool: readonly number[],
  pick: number,
  min: number,
  max: number,
): number {
  return inRange(buildWays(pool, pick), 0, pick, min, max);
}

function checkFixed(fixed: readonly number[]): string | null {
  if (fixed.length > LOTTO_PICK_COUNT) {
    return `고정 번호는 최대 ${LOTTO_PICK_COUNT}개까지 가능합니다`;
  }
  for (const n of fixed) {
    if (!Number.isInteger(n) || n < LOTTO_MIN || n > LOTTO_MAX) {
      return `고정 번호는 ${LOTTO_MIN}~${LOTTO_MAX} 범위의 정수여야 합니다: ${n}`;
    }
  }
  if (new Set(fixed).size !== fixed.length) return "고정 번호에 중복이 있습니다";
  return null;
}

const NONE = "이 가정 아래 남은 조합이 없습니다";

/**
 * fixed 를 넣고 나머지를 pool\fixed 에서 골라 6개 합이 [min,max] 인 조합을 정확히 고르게 하나 뽑는다.
 * 번호마다 「넣는다/뺀다」를 남은 경우의 수 비율로 정한다(거절 표집 아님).
 */
export function drawInSumRange(
  random: RandomPort,
  pool: readonly number[],
  fixed: readonly number[],
  min: number,
  max: number,
): Result<Combination> {
  const bad = checkFixed(fixed);
  if (bad) return err(bad);
  const fixedSet = new Set(fixed);
  const rest = [...new Set(pool)].filter((n) => !fixedSet.has(n));
  let need = LOTTO_PICK_COUNT - fixed.length;
  const fixedSum = fixed.reduce((a, b) => a + b, 0);
  let lo = min - fixedSum;
  let hi = max - fixedSum;
  const ways = buildWays(rest, need);
  if (inRange(ways, 0, need, lo, hi) === 0) return err(NONE);

  const chosen: number[] = [];
  for (let i = 0; i < rest.length && need > 0; i += 1) {
    const v = rest[i] as number;
    const take = inRange(ways, i + 1, need - 1, lo - v, hi - v);
    const skip = inRange(ways, i + 1, need, lo, hi);
    if (random() * (take + skip) < take) {
      chosen.push(v);
      need -= 1;
      lo -= v;
      hi -= v;
    }
  }
  return createCombination([...fixed, ...chosen]);
}

/** 같은 조건의 조합을 모두 나열한다. 호출자가 개수가 작음을 보장해야 한다. */
export function listInSumRange(
  pool: readonly number[],
  fixed: readonly number[],
  min: number,
  max: number,
): Combination[] {
  const fixedSet = new Set(fixed);
  const rest = [...new Set(pool)].filter((n) => !fixedSet.has(n));
  const need = LOTTO_PICK_COUNT - fixed.length;
  const fixedSum = fixed.reduce((a, b) => a + b, 0);
  const ways = buildWays(rest, need);
  const out: Combination[] = [];
  const walk = (i: number, k: number, lo: number, hi: number, acc: number[]): void => {
    if (inRange(ways, i, k, lo, hi) === 0) return;
    if (k === 0) {
      const c = createCombination([...fixed, ...acc]);
      if (c.ok) out.push(c.value);
      return;
    }
    const v = rest[i] as number;
    walk(i + 1, k - 1, lo - v, hi - v, [...acc, v]);
    walk(i + 1, k, lo, hi, acc);
  };
  walk(0, need, min - fixedSum, max - fixedSum, []);
  return out;
}
