import { useCallback, useEffect, useSyncExternalStore } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { createServerCache } from "@infrastructure/serverCache";
import { PickViewModel } from "../_model/Pick.viewmodel";
import { picksListResponse } from "../_mapper/picksList.mapper";

/** 이 유스케이스의 토큰 — 조립 루트가 이 토큰에 캐시를 한 번 짓는다 */
export const LIST_PICKS = token<ReturnType<typeof createListPicksCache>>("listPicks");

/** 짓는 법 — 조회 조건이 없으므로(현재 사용자의 픽 전부) 캐시키도 하나다 */
export function createListPicksCache(http: HttpClient) {
  return createServerCache<void, PickViewModel[]>(
    () => "picks",
    async () => PickViewModel.fromMany(picksListResponse(await http.get("/api/picks"))),
  );
}

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useListPicksAction() {
  const cache = useResolve(LIST_PICKS);
  const subscribe = useCallback((fn: () => void) => cache.subscribe(undefined, fn), [cache]);
  const entry = useSyncExternalStore(subscribe, () => cache.read(undefined), readOnServer);
  useEffect(() => cache.ensure(), [cache]);

  return {
    loading: entry === undefined || entry.status === "loading",
    error: entry?.error ?? null,
    picks: entry?.value ?? [],
    retry: () => cache.invalidate(),
  };
}
