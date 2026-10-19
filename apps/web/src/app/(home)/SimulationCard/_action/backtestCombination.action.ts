import { useCallback, useState } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { SimulationResultViewModel } from "../_model/SimulationResult.viewmodel";
import { simulationBacktestRequest, simulationBacktestResponse } from "../_mapper/simulationBacktest.mapper";

export const BACKTEST_COMBINATION = token<ReturnType<typeof createBacktestCombination>>("backtestCombination");

/** 짓는 법 — 누를 때마다 그 조합으로 새로 계산하는 요청이라 캐시하지 않는다. 요청 한 번을 하고 표시 모델을 돌려준다 */
export function createBacktestCombination(http: HttpClient) {
  return async (numbers: readonly number[]): Promise<SimulationResultViewModel> => {
    const res = await http.send<Parameters<typeof simulationBacktestResponse>[0]>("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(simulationBacktestRequest(numbers)),
    });
    return SimulationResultViewModel.from(simulationBacktestResponse(res));
  };
}

/**
 * 백테스트 — frontend-module-layout 규칙 3.3 의 모양.
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다. 낡게 만드는 조회 캐시는 없다.
 */
export function useBacktestCombinationAction() {
  const backtest = useResolve(BACKTEST_COMBINATION);
  const [result, setResult] = useState<SimulationResultViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (numbers: readonly number[]) => {
      setPending(true);
      setError(null);
      try {
        setResult(await backtest(numbers));
      } catch (e) {
        setError(e instanceof Error ? e.message : "시뮬레이션에 실패했습니다");
      } finally {
        setPending(false);
      }
    },
    [backtest],
  );

  return { run, result, pending, error };
}
