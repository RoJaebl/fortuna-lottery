import { useCallback, useState } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { GeneratedCombinationViewModel } from "../model/GeneratedCombination.viewmodel";
import type { GeneratorMode } from "../model/GeneratorMode.model";
import { generatorGenerateRequest, generatorGenerateResponse } from "../mapper/generatorGenerate.mapper";

export const GENERATE_COMBINATION = token<ReturnType<typeof createGenerateCombination>>("generateCombination");

/** 짓는 법 — 누를 때마다 새 조합을 받는 요청이라 캐시하지 않는다. 요청 한 번을 하고 표시 모델을 돌려준다 */
export function createGenerateCombination(http: HttpClient) {
  return async (mode: GeneratorMode, selected: readonly number[]): Promise<GeneratedCombinationViewModel> => {
    const res = await http.send<Parameters<typeof generatorGenerateResponse>[0]>("/api/generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatorGenerateRequest(mode, selected)),
    });
    return GeneratedCombinationViewModel.from(generatorGenerateResponse(res));
  };
}

/**
 * 조합 생성 — frontend-module-layout 규칙 3.3 의 모양.
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다. 낡게 만드는 조회 캐시는 없다.
 */
export function useGenerateCombinationAction() {
  const generate = useResolve(GENERATE_COMBINATION);
  const [result, setResult] = useState<GeneratedCombinationViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (mode: GeneratorMode, selected: readonly number[]): Promise<GeneratedCombinationViewModel | null> => {
      setPending(true);
      setError(null);
      try {
        const combination = await generate(mode, selected);
        setResult(combination);
        return combination;
      } catch (e) {
        setError(e instanceof Error ? e.message : "생성에 실패했습니다");
        return null;
      } finally {
        setPending(false);
      }
    },
    [generate],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, result, pending, error, clearError };
}
