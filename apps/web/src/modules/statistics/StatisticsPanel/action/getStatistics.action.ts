import { useEffect, useSyncExternalStore } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { createServerCache } from "@/shared/lib/serverCache";
import { StatisticsViewModel } from "../../model/Statistics.viewmodel";
import { getStatisticsResponse } from "../mapper/getStatistics.mapper";

/** 이 유스케이스의 캐시 — 앱에 하나다. 조회 조건이 없으므로 캐시키도 하나다 */
export const statisticsCache = createServerCache<void, StatisticsViewModel>(
  () => "statistics",
  async () => StatisticsViewModel.from(getStatisticsResponse(await fetchJson("/api/statistics"))),
);

const subscribe = (fn: () => void) => statisticsCache.subscribe(undefined, fn);
const read = () => statisticsCache.read(undefined);
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetStatisticsAction() {
  const entry = useSyncExternalStore(subscribe, read, readOnServer);
  useEffect(() => statisticsCache.ensure(), []);

  return {
    error: entry?.error ?? null,
    stats: entry?.value ?? null,
  };
}
