import {
  countInSumRange,
  drawInSumRange,
  err,
  listInSumRange,
  ok,
  type Combination,
  type RandomPort,
  type Result,
} from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { combinationKey, inSumRange, sumOf } from "./assumption.js";

const NONE = "이 가정 아래 남은 조합이 없습니다";
/** 남은 조합이 이 수 이하면 전부 나열해 그 가운데서 고른다. */
const LIST_LIMIT = 4_096;

// 백테스트는 같은 회차에서 20 장을 잇달아 뽑으므로 마지막 셈 하나만 기억한다.
let last = { pastKeys: null as ReadonlySet<string> | null, key: "", left: 0 };

/** 고른 번호를 품고 합이 구간 안인 조합 수에서, 그 가운데 과거 1등 수를 뺀 값. */
function remaining(assumption: Assumption, pool: readonly number[], pastKeys: ReadonlySet<string>): number {
  const { fixed, sumRange } = assumption;
  const key = `${pool.join(",")}|${fixed.join(",")}|${sumRange.min}|${sumRange.max}`;
  if (last.pastKeys !== pastKeys || last.key !== key) {
    last = { pastKeys, key, left: remainingCount(fixed, sumRange, pool, pastKeys) };
  }
  return last.left;
}

export function remainingCount(
  fixed: readonly number[],
  sumRange: Assumption["sumRange"],
  pool: readonly number[],
  pastKeys: ReadonlySet<string>,
): number {
  const fixedSet = new Set(fixed);
  const poolSet = new Set(pool);
  const rest = [...poolSet].filter((n) => !fixedSet.has(n));
  const fixedSum = sumOf(fixed);
  const all = countInSumRange(rest, 6 - fixed.length, sumRange.min - fixedSum, sumRange.max - fixedSum);
  let past = 0;
  for (const key of pastKeys) {
    const numbers = key.split(",").map(Number);
    const inUniverse =
      fixed.every((n) => numbers.includes(n)) &&
      numbers.every((n) => fixedSet.has(n) || poolSet.has(n)) &&
      inSumRange(numbers, sumRange);
    if (inUniverse) past++;
  }
  return all - past;
}

/**
 * 가정 우주 안에서 고른 번호를 넣은 조합 하나를 정확히 고르게 뽑는다.
 * 고른 번호 검사와 「제외 전 남은 조합 없음」은 커널이 거절한다.
 */
export function drawAssumed(
  random: RandomPort,
  assumption: Assumption,
  pool: readonly number[],
  pastKeys: ReadonlySet<string>,
): Result<Combination> {
  const { fixed, sumRange } = assumption;
  const draw = () => drawInSumRange(random, pool, fixed, sumRange.min, sumRange.max);
  const first = draw();
  if (!first.ok || !assumption.excludePastWinners) return first;

  const left = remaining(assumption, pool, pastKeys);
  if (left === 0) return err(NONE);
  if (left <= LIST_LIMIT) {
    const list = listInSumRange(pool, fixed, sumRange.min, sumRange.max).filter(
      (c) => !pastKeys.has(combinationKey(c)),
    );
    return ok(list[Math.floor(random() * list.length)]!);
  }
  // 남은 조합이 LIST_LIMIT 보다 많고 빠지는 것은 과거 1등뿐이라 다시 뽑기는 곧 끝난다.
  let r: Result<Combination> = first;
  while (r.ok && pastKeys.has(combinationKey(r.value))) r = draw();
  return r;
}
