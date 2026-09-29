import { z } from "zod";
import { combinationSchema } from "../shared/combination.js";

/** 조합 생성 요청 — 자동(빈 fixed) / 부분 선택 / 직접 입력(6개 fixed) */
export const GeneratorGenerateRequestSchema = z.object({
  fixedNumbers: z.array(z.number()).optional(),
  excludedNumbers: z.array(z.number()).optional(),
});
export type GeneratorGenerateRequest = z.infer<typeof GeneratorGenerateRequestSchema>;

export const GeneratorGenerateResponseSchema = z.object({
  numbers: combinationSchema,
});
export type GeneratorGenerateResponse = z.infer<typeof GeneratorGenerateResponseSchema>;
