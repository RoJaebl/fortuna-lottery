import { useCallback, useState } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import type { DomainEvents } from "@infrastructure/events";

/** 이 action 이 내는 사건 — 이름과 값의 타입을 내는 쪽이 정의하고 공개 표면으로 내놓는다 */
export const PICKS_REMOVED = "picks.removed";
export interface PicksRemoved {
  id: string;
}

export const DELETE_PICK = token<ReturnType<typeof createDeletePick>>("deletePick");

/**
 * 짓는 법 — 요청 본문도 응답 값도 쓰지 않는다(경로의 id 뿐이라 변환기가 없다).
 * 성공하면 사건을 내고 캐시를 건드리지 않는다.
 */
export function createDeletePick(http: HttpClient, events: DomainEvents) {
  return async (id: string): Promise<void> => {
    await http.send(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
    events.emit(PICKS_REMOVED, { id } satisfies PicksRemoved);
  };
}

export function useDeletePickAction() {
  const remove = useResolve(DELETE_PICK);
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
