import { useCallback, useRef, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import type { AssumptionModel } from "../model/Evaluation.model";
import { EvaluationViewModel } from "../model/Evaluation.viewmodel";
import { hypothesisEvaluateRequest, hypothesisEvaluateResponse } from "../mapper/hypothesisEvaluate.mapper";

/**
 * 가정 평가 — 누를 때마다 그 가정으로 새로 계산하는 요청이라 캐시하지 않는다(frontend-module-layout 규칙 3.3 의 모양).
 * 결과·진행·오류는 그 요청의 경과이고 누른 화면 하나의 것이므로 훅 안에 산다.
 */
export function useEvaluateAssumptionAction() {
  const [result, setResult] = useState<EvaluationViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 요청 세대 — clear() 와 새 run 이 올리고, 늦게 온 응답은 세대가 다르면 버린다
  const generation = useRef(0);

  const run = useCallback(async (assumption: AssumptionModel) => {
    const mine = ++generation.current;
    setPending(true);
    setError(null);
    try {
      const res = await fetchJson<Parameters<typeof hypothesisEvaluateResponse>[0]>("/api/hypothesis/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hypothesisEvaluateRequest(assumption)),
      });
      if (mine !== generation.current) return;
      setResult(EvaluationViewModel.from(hypothesisEvaluateResponse(res)));
    } catch (e) {
      if (mine !== generation.current) return;
      setError(e instanceof Error ? e.message : "가정 평가에 실패했습니다");
    } finally {
      if (mine === generation.current) setPending(false);
    }
  }, []);

  /** 가정이 바뀌면 앞선 결과는 다른 가정을 말하므로 비운다 */
  const clear = useCallback(() => {
    generation.current++;
    setResult(null);
    setError(null);
    setPending(false);
  }, []);

  return { run, result, pending, error, clear };
}
