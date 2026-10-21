import { useCallback, useState } from "react";
import { store } from "@framework";
import { useStore } from "@framework/react";
import { picksCreateRequest } from "../_mapper/picksCreate.mapper";

/** 이 파일이 올리는 key 둘 — 내는 사건도 내는 쪽인 이 파일이 등록부에 올린다 */
declare module "@lib/store" {
  interface StoreRegistry {
    "event.picks.saved": { numbers: readonly number[] };
    "http.picks.save": (numbers: readonly number[]) => Promise<void>;
  }
}

store.event("event.picks.saved", { from: "tab" });

/** 정의 — 요청 한 번을 하는 함수를 돌려준다. 성공하면 사건을 내고 캐시를 건드리지 않는다 */
store.http("http.picks.save", ({ http, emit }) => async (numbers) => {
  await http.send("/api/picks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(picksCreateRequest(numbers)),
  });
  emit("event.picks.saved", { numbers });
});

export function useSavePickAction() {
  const save = useStore("http.picks.save");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (numbers: readonly number[]): Promise<boolean> => {
      setPending(true);
      setError(null);
      try {
        await save(numbers);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장에 실패했습니다");
        return false;
      } finally {
        setPending(false);
      }
    },
    [save],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
