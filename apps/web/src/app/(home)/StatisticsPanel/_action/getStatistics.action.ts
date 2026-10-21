import { useCallback, useEffect, useSyncExternalStore } from "react";
import { store } from "@framework";
import { useStore } from "@framework/react";
import { createServerCache } from "@lib/cache";
import { StatisticsViewModel } from "../_model/Statistics.viewmodel";
import { statisticsReadResponse } from "../_mapper/statisticsRead.mapper";

declare module "@lib/store" {
  interface StoreRegistry {
    "cache.statistics.get": ReturnType<typeof createServerCache<void, StatisticsViewModel>>;
  }
}

/** 정의 — 조회 조건이 없으므로 캐시키도 하나다. 인스턴스는 컨테이너가 처음 꺼낼 때 짓는다 */
store.cache("cache.statistics.get", ({ http }) =>
  createServerCache<void, StatisticsViewModel>(
    () => "statistics",
    async () => StatisticsViewModel.from(statisticsReadResponse(await http.get("/api/statistics"))),
  ),
);

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetStatisticsAction() {
  const cache = useStore("cache.statistics.get");
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
