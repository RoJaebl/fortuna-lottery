import { z } from "zod";

/** 번호 조합의 와이어 모양 — 6개 · 1~45 정수 — 모양만 본다. 중복 금지는 도메인 규칙이라 넣지 않는다. 내부 전용, 공개하지 않는다. */
export const combinationSchema = z
  .array(z.number().int().min(1).max(45))
  .length(6);
