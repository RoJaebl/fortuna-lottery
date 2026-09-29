import {
  createCombination,
  LOTTO_MAX,
  LOTTO_MIN,
  LOTTO_PICK_COUNT,
  type Combination,
} from "@fortuna-lottery/kernel";
import { err, type Result } from "@fortuna-lottery/kernel";
import type { RandomPort } from "@fortuna-lottery/kernel";

/**
 * 조합 생성 — 자동(fixed 없음) / 부분 선택(fixed 1~5개) / 직접 입력(fixed 6개).
 * fixed는 반드시 포함, excluded는 반드시 제외한다. 난수는 포트로 주입(테스트 결정성).
 */
export function generate(
  random: RandomPort,
  fixed: readonly number[] = [],
  excluded: readonly number[] = [],
): Result<Combination> {
  if (fixed.length > LOTTO_PICK_COUNT) {
    return err(`고정 번호는 최대 ${LOTTO_PICK_COUNT}개까지 가능합니다`);
  }
  for (const n of fixed) {
    if (!Number.isInteger(n) || n < LOTTO_MIN || n > LOTTO_MAX) {
      return err(`고정 번호는 ${LOTTO_MIN}~${LOTTO_MAX} 범위의 정수여야 합니다: ${n}`);
    }
  }
  if (new Set(fixed).size !== fixed.length) {
    return err("고정 번호에 중복이 있습니다");
  }
  const excludedSet = new Set(excluded);
  for (const n of fixed) {
    if (excludedSet.has(n)) {
      return err(`번호 ${n}은(는) 고정과 제외에 동시에 지정할 수 없습니다`);
    }
  }

  const pool: number[] = [];
  const fixedSet = new Set(fixed);
  for (let n = LOTTO_MIN; n <= LOTTO_MAX; n += 1) {
    if (!fixedSet.has(n) && !excludedSet.has(n)) pool.push(n);
  }
  const need = LOTTO_PICK_COUNT - fixed.length;
  if (pool.length < need) {
    return err("제외 번호가 너무 많아 조합을 만들 수 없습니다");
  }

  // 부분 Fisher-Yates로 need개 추출
  for (let i = 0; i < need; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    const tmp = pool[i] as number;
    pool[i] = pool[j] as number;
    pool[j] = tmp;
  }
  return createCombination([...fixed, ...pool.slice(0, need)]);
}
