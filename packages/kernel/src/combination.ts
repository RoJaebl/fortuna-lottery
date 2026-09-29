import { err, ok, type Result } from "./result.js";

export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;
export const LOTTO_PICK_COUNT = 6;
/** 6/45 전체 조합 수 — 당첨 확률 시각화의 고정 분모 (정직성 장치) */
export const TOTAL_COMBINATIONS = 8_145_060;

/** 검증 완료된 6개 번호 조합 (오름차순 정렬 보장) */
export type Combination = readonly number[];

/**
 * CombinationVO 생성 — 6개 · 1~45 · 정수 · 중복 없음을 검증한다.
 * 유일한 조합 생성 경로이므로, Combination 타입이 곧 검증 완료를 뜻한다.
 */
export function createCombination(numbers: readonly number[]): Result<Combination> {
  if (numbers.length !== LOTTO_PICK_COUNT) {
    return err(`번호는 정확히 ${LOTTO_PICK_COUNT}개여야 합니다 (현재 ${numbers.length}개)`);
  }
  for (const n of numbers) {
    if (!Number.isInteger(n)) {
      return err(`번호는 정수여야 합니다: ${n}`);
    }
    if (n < LOTTO_MIN || n > LOTTO_MAX) {
      return err(`번호는 ${LOTTO_MIN}~${LOTTO_MAX} 범위여야 합니다: ${n}`);
    }
  }
  if (new Set(numbers).size !== numbers.length) {
    return err("중복된 번호가 있습니다");
  }
  return ok(Object.freeze([...numbers].sort((a, b) => a - b)));
}
