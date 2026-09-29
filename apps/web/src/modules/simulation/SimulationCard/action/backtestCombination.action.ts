import { useCallback, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { SimulationResultViewModel } from "../../model/SimulationResult.viewmodel";
import { backtestCombinationRequest, backtestCombinationResponse } from "../mapper/backtestCombination.mapper";

/**
 * 백테스트 — 누를 때마다 그 조합으로 새로 계산하는 요청이라 캐시하지 않는다(frontend-module-layout 규칙 3.3 의 모양).
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다. 낡게 만드는 조회 캐시는 없다.
 */
export function useBacktestCombinationAction() {
  const [result, setResult] = useState<SimulationResultViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (numbers: readonly number[]) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetchJson("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backtestCombinationRequest(numbers)),
      });
      setResult(SimulationResultViewModel.from(backtestCombinationResponse(res)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "시뮬레이션에 실패했습니다");
    } finally {
      setPending(false);
    }
  }, []);

  return { run, result, pending, error };
}
