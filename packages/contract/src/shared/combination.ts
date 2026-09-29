import { z } from "zod";

/** 번호 조합의 와이어 모양 — 6개 · 1~45 정수 · 중복 없음 (core 의 CombinationVO 와 같은 규칙). 내부 전용, 공개하지 않는다. */
export const combinationSchema = z
  .array(z.number().int().min(1).max(45))
  .length(6)
  .refine((numbers) => new Set(numbers).size === numbers.length, "중복된 번호가 있습니다");
