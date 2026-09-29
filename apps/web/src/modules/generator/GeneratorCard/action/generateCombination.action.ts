import { useCallback, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { GeneratedCombinationViewModel } from "../../model/GeneratedCombination.viewmodel";
import type { GeneratorMode } from "../../model/GeneratorMode.model";
import { generateCombinationRequest, generateCombinationResponse } from "../mapper/generateCombination.mapper";

/**
 * 조합 생성 — 누를 때마다 새 조합을 받는 요청이라 캐시하지 않는다(frontend-module-layout 규칙 3.3 의 모양).
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다. 낡게 만드는 조회 캐시는 없다.
 */
export function useGenerateCombinationAction() {
  const [result, setResult] = useState<GeneratedCombinationViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (mode: GeneratorMode, selected: readonly number[]): Promise<GeneratedCombinationViewModel | null> => {
      setPending(true);
      setError(null);
      try {
        const res = await fetchJson("/api/generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generateCombinationRequest(mode, selected)),
        });
        const combination = GeneratedCombinationViewModel.from(generateCombinationResponse(res));
        setResult(combination);
        return combination;
      } catch (e) {
        setError(e instanceof Error ? e.message : "생성에 실패했습니다");
        return null;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, result, pending, error, clearError };
}
