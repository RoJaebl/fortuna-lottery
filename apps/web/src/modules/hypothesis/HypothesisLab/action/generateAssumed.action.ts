import { useCallback, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import type { AssumptionModel } from "../model/Evaluation.model";
import { hypothesisGenerateRequest, hypothesisGenerateResponse } from "../mapper/hypothesisGenerate.mapper";

/** 가정 우주에서 조합 하나 뽑기 — 누를 때마다 새 조합이라 캐시하지 않는다. 뽑은 번호는 조정자가 셸로 올린다 */
export function useGenerateAssumedAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (assumption: AssumptionModel): Promise<number[] | null> => {
    setPending(true);
    setError(null);
    try {
      const res = await fetchJson<Parameters<typeof hypothesisGenerateResponse>[0]>("/api/hypothesis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hypothesisGenerateRequest(assumption)),
      });
      return hypothesisGenerateResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "뽑기에 실패했습니다");
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error };
}
