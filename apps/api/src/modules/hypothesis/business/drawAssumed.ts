import { err, generate, type Combination, type RandomPort, type Result } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { combinationKey } from "./assumption.js";

/** 가정 우주 안에서 조합 하나를 뽑는다. count 는 우주 크기(0 이면 거절). */
export function drawAssumed(
  random: RandomPort,
  assumption: Assumption,
  pool: readonly number[],
  pastKeys: ReadonlySet<string>,
  count: number,
): Result<Combination> {
  if (count === 0) return err("이 가정 아래 남은 조합이 없습니다");
  const inPool = new Set(pool);
  const excluded = Array.from({ length: 45 }, (_, i) => i + 1).filter((n) => !inPool.has(n));
  // count > 0 이므로 거절 표집은 끝난다.
  for (;;) {
    const r = generate(random, [], excluded);
    if (!r.ok) return r;
    if (!(assumption.excludePastWinners && pastKeys.has(combinationKey(r.value)))) return r;
  }
}
