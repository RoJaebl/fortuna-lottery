import type { Result } from "@fortuna-lottery/kernel";
import { ok } from "@fortuna-lottery/kernel";
import type { RandomPort } from "@fortuna-lottery/kernel";
import { generate } from "../../domain/generate";
import type { GeneratorGenerateRequest, GeneratorGenerateResponse } from "@fortuna-lottery/contract/generator";

/** 조합 생성 유스케이스 — 난수 포트 주입 (프로덕션: Math.random / 테스트: 시드 고정) */
export const makeGenerateCombination =
  (random: RandomPort) =>
  (request: GeneratorGenerateRequest): Result<GeneratorGenerateResponse> => {
    const result = generate(random, request.fixedNumbers ?? [], request.excludedNumbers ?? []);
    if (!result.ok) return result;
    return ok({ numbers: [...result.value] });
  };
