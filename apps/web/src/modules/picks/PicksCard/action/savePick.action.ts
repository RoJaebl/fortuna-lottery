import { useCallback, useState } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import type { DomainEvents } from "@infrastructure/events";
import { picksCreateRequest } from "../mapper/picksCreate.mapper";

/** 이 action 이 내는 사건 — 이름과 값의 타입을 내는 쪽이 정의하고 공개 표면으로 내놓는다 */
export const PICKS_SAVED = "picks.saved";
export interface PicksSaved {
  numbers: readonly number[];
}

export const SAVE_PICK = token<ReturnType<typeof createSavePick>>("savePick");

/** 짓는 법 — 요청 한 번을 하는 함수를 내놓는다. 성공하면 사건을 내고 캐시를 건드리지 않는다 */
export function createSavePick(http: HttpClient, events: DomainEvents) {
  return async (numbers: readonly number[]): Promise<void> => {
    await http.send("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(picksCreateRequest(numbers)),
    });
    events.emit(PICKS_SAVED, { numbers } satisfies PicksSaved);
  };
}

export function useSavePickAction() {
  const save = useResolve(SAVE_PICK);
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
