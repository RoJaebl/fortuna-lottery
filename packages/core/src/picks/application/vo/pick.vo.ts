import { createCombination, type Combination } from "../../../shared/combination";
import { err, ok, type Result } from "../../../shared/result";

/** 픽 VO — 사용자 키 + 검증된 조합의 결합 (도메인 조합 계층) */
export interface PickVO {
  readonly userId: string;
  readonly combination: Combination;
}

export function createPickVO(userId: string, numbers: readonly number[]): Result<PickVO> {
  if (!userId) return err("사용자 식별자가 없습니다");
  const combination = createCombination(numbers);
  if (!combination.ok) return combination;
  return ok({ userId, combination: combination.value });
}
