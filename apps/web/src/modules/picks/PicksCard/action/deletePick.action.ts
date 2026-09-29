import { useCallback, useState } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { listPicksCache } from "./listPicks.action";

/**
 * 픽 삭제 — 요청 본문도 응답 값도 쓰지 않는다(경로의 id 뿐이라 변환기가 없다).
 * 성공하면 이 바꿈이 낡게 만든 목록 캐시를 여기서 버린다.
 */
export function useDeletePickAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (id: string): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await fetchJson(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
      listPicksCache.invalidate();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
