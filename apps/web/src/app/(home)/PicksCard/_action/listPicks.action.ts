import { useCallback, useEffect, useSyncExternalStore } from "react";
import { store } from "@lib/store";
import { useStore } from "@lib/store/react";
import { createServerCache } from "@infrastructure/serverCache";
import { PickViewModel } from "../_model/Pick.viewmodel";
import { picksListResponse } from "../_mapper/picksList.mapper";

declare module "@lib/store" {
  interface StoreRegistry {
    "cache.picks.list": ReturnType<typeof createServerCache<void, PickViewModel[]>>;
  }
}

/** 정의 — 조회 조건이 없으므로(현재 사용자의 픽 전부) 캐시키도 하나다. 인스턴스는 컨테이너가 처음 꺼낼 때 짓는다 */
store.cache("cache.picks.list", ({ http }) =>
  createServerCache<void, PickViewModel[]>(
    () => "picks",
    async () => PickViewModel.fromMany(picksListResponse(await http.get("/api/picks"))),
  ),
);

/** 이 캐시가 무엇에 낡는가 — 규칙은 낡는 쪽인 이 파일에 둔다 */
store.invalidates("event.picks.saved", "cache.picks.list", { from: "tab" });
store.invalidates("event.picks.removed", "cache.picks.list", { from: "tab" });

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useListPicksAction() {
  const cache = useStore("cache.picks.list");
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
