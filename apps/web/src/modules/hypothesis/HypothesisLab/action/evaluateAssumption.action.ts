import { useCallback, useRef, useState } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import type { AssumptionModel } from "../model/Evaluation.model";
import { EvaluationViewModel } from "../model/Evaluation.viewmodel";
import { hypothesisEvaluateRequest, hypothesisEvaluateResponse } from "../mapper/hypothesisEvaluate.mapper";

export const EVALUATE_ASSUMPTION = token<ReturnType<typeof createEvaluateAssumption>>("evaluateAssumption");

/** 짓는 법 — 누를 때마다 그 가정으로 새로 계산하는 요청이라 캐시하지 않는다. 요청 한 번을 하고 표시 모델을 돌려준다 */
export function createEvaluateAssumption(http: HttpClient) {
  return async (assumption: AssumptionModel): Promise<EvaluationViewModel> => {
    const res = await http.send<Parameters<typeof hypothesisEvaluateResponse>[0]>("/api/hypothesis/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hypothesisEvaluateRequest(assumption)),
    });
    return EvaluationViewModel.from(hypothesisEvaluateResponse(res));
  };
}

/**
 * 가정 평가 — frontend-module-layout 규칙 3.3 의 모양.
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다.
 */
export function useEvaluateAssumptionAction() {
  const evaluate = useResolve(EVALUATE_ASSUMPTION);
  const [result, setResult] = useState<EvaluationViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 요청 세대 — clear() 와 새 run 이 올리고, 늦게 온 응답은 세대가 다르면 버린다
  const generation = useRef(0);

  const run = useCallback(
    async (assumption: AssumptionModel) => {
      const mine = ++generation.current;
      setPending(true);
      setError(null);
      try {
        const evaluation = await evaluate(assumption);
        if (mine !== generation.current) return;
        setResult(evaluation);
      } catch (e) {
        if (mine !== generation.current) return;
        setError(e instanceof Error ? e.message : "가정 평가에 실패했습니다");
      } finally {
        if (mine === generation.current) setPending(false);
      }
    },
    [evaluate],
  );

  /** 가정이 바뀌면 앞선 결과는 다른 가정을 말하므로 비운다 */
  const clear = useCallback(() => {
    generation.current++;
    setResult(null);
    setError(null);
    setPending(false);
  }, []);

  return { run, result, pending, error, clear };
}
