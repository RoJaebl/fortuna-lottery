import { useCallback, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { savePickRequest } from "../mapper/savePick.mapper";
import { listPicksCache } from "./listPicks.action";

/** 픽 저장 — 성공하면 이 바꿈이 낡게 만든 목록 캐시를 여기서 버린다(조정자가 「저장 후 재조회」를 잇지 않는다) */
export function useSavePickAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (numbers: readonly number[]): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await fetchJson("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePickRequest(numbers)),
      });
      listPicksCache.invalidate();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
