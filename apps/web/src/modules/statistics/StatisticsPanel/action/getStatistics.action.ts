import { useCallback, useEffect, useSyncExternalStore } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { createServerCache } from "@infrastructure/serverCache";
import { StatisticsViewModel } from "../model/Statistics.viewmodel";
import { statisticsReadResponse } from "../mapper/statisticsRead.mapper";

/** 이 유스케이스의 토큰 — 조립 루트가 이 토큰에 캐시를 한 번 짓는다 */
export const STATISTICS = token<ReturnType<typeof createStatisticsCache>>("statistics");

/** 짓는 법 — 조회 조건이 없으므로 캐시키도 하나다 */
export function createStatisticsCache(http: HttpClient) {
  return createServerCache<void, StatisticsViewModel>(
    () => "statistics",
    async () => StatisticsViewModel.from(statisticsReadResponse(await http.get("/api/statistics"))),
  );
}

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetStatisticsAction() {
  const cache = useResolve(STATISTICS);
  const subscribe = useCallback((fn: () => void) => cache.subscribe(undefined, fn), [cache]);
  const entry = useSyncExternalStore(subscribe, () => cache.read(undefined), readOnServer);
  useEffect(() => cache.ensure(), [cache]);

  return {
    loading: entry === undefined || entry.status === "loading",
    error: entry?.error ?? null,
    stats: entry?.value ?? null,
    retry: () => cache.invalidate(),
  };
}
