import { useEffect, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import type { PopularityViewModel } from "../model/Popularity.viewmodel";
import { hypothesisPopularityRequest, hypothesisPopularityResponse } from "../mapper/hypothesisPopularity.mapper";

/**
 * 인기 패턴 — 현재 조합이 바뀔 때마다 다시 묻는다. 조합이 없으면 묻지 않는다.
 * 앞선 요청의 응답이 늦게 오면 버린다(조합이 이미 바뀌었으므로).
 */
export function useCheckPopularityAction(numbers: number[] | null) {
  const [result, setResult] = useState<PopularityViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 배열의 정체가 아니라 내용이 바뀔 때만 다시 묻는다 — 렌더마다 새 배열을 넘겨도 요청이 되풀이되지 않는다
  const key = numbers ? numbers.join(",") : null;

  useEffect(() => {
    setResult(null);
    setError(null);
    if (key === null) return;
    let stale = false;
    fetchJson<Parameters<typeof hypothesisPopularityResponse>[0]>("/api/hypothesis/popularity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hypothesisPopularityRequest(key.split(",").map(Number))),
    })
      .then((res) => {
        if (!stale) setResult(hypothesisPopularityResponse(res));
      })
      .catch((e: unknown) => {
        if (!stale) setError(e instanceof Error ? e.message : "인기 패턴 확인에 실패했습니다");
      });
    return () => {
      stale = true;
    };
  }, [key]);

  return { result, error };
}
