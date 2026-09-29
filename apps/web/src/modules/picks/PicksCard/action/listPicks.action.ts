import { useEffect, useSyncExternalStore } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { createServerCache } from "@/shared/lib/serverCache";
import { PickViewModel } from "../../model/Pick.viewmodel";
import { listPicksResponse } from "../mapper/listPicks.mapper";

/** 이 유스케이스의 캐시 — 앱에 하나다. 조회 조건이 없으므로(현재 사용자의 픽 전부) 캐시키도 하나다 */
export const listPicksCache = createServerCache<void, PickViewModel[]>(
  () => "picks",
  async () => PickViewModel.fromMany(listPicksResponse(await fetchJson("/api/picks"))),
);

const subscribe = (fn: () => void) => listPicksCache.subscribe(undefined, fn);
const read = () => listPicksCache.read(undefined);
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useListPicksAction() {
  const entry = useSyncExternalStore(subscribe, read, readOnServer);
  useEffect(() => listPicksCache.ensure(), []);

  return {
    loading: entry === undefined || entry.status === "loading",
    error: entry?.error ?? null,
    picks: entry?.value ?? [],
  };
}
