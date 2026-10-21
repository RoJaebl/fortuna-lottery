import { useCallback, useState } from "react";
import { store } from "@framework";
import { useStore } from "@framework/react";
import type { AssumptionModel } from "../_model/Evaluation.model";
import { hypothesisGenerateRequest, hypothesisGenerateResponse } from "../_mapper/hypothesisGenerate.mapper";

declare module "@lib/store" {
  interface StoreRegistry {
    "http.hypothesis.generate": (assumption: AssumptionModel) => Promise<number[]>;
  }
}

/** 정의 — 가정 우주에서 조합 하나 뽑기. 누를 때마다 새 조합이라 캐시하지 않는다 */
store.http("http.hypothesis.generate", ({ http }) => async (assumption) => {
  const res = await http.send<Parameters<typeof hypothesisGenerateResponse>[0]>("/api/hypothesis/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hypothesisGenerateRequest(assumption)),
  });
  return hypothesisGenerateResponse(res);
});

/** 뽑은 번호는 조정자가 셸로 올린다 */
export function useGenerateAssumedAction() {
  const generate = useStore("http.hypothesis.generate");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (assumption: AssumptionModel): Promise<number[] | null> => {
      setPending(true);
      setError(null);
      try {
        return await generate(assumption);
      } catch (e) {
        setError(e instanceof Error ? e.message : "뽑기에 실패했습니다");
        return null;
      } finally {
        setPending(false);
      }
    },
    [generate],
  );

  return { run, pending, error };
}
