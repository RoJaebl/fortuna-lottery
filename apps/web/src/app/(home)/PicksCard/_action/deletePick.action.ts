import { useCallback, useState } from "react";
import { store } from "@lib/store";
import { useStore } from "@lib/store/react";

/** 이 파일이 올리는 key 둘 — 내는 사건도 내는 쪽인 이 파일이 등록부에 올린다 */
declare module "@lib/store" {
  interface StoreRegistry {
    "event.picks.removed": { id: string };
    "http.picks.delete": (id: string) => Promise<void>;
  }
}

store.event("event.picks.removed", { from: "tab" });

/**
 * 정의 — 요청 본문도 응답 값도 쓰지 않는다(경로의 id 뿐이라 변환기가 없다).
 * 성공하면 사건을 내고 캐시를 건드리지 않는다.
 */
store.http("http.picks.delete", ({ http, emit }) => async (id) => {
  await http.send(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
  emit("event.picks.removed", { id });
});

export function useDeletePickAction() {
  const remove = useStore("http.picks.delete");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (id: string): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        await remove(id);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
        return false;
      } finally {
        setPending(false);
      }
    },
    [remove],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
