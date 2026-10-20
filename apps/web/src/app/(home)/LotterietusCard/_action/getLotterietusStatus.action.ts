import { useCallback, useEffect, useSyncExternalStore } from "react";
import { store } from "@lib/store";
import { useStore } from "@lib/store/react";
import { createServerCache } from "@infrastructure/serverCache";
import { LotterietusViewModel } from "../_model/Lotterietus.viewmodel";
import { lotterietusReadResponse } from "../_mapper/lotterietusRead.mapper";

declare module "@lib/store" {
  interface StoreRegistry {
    "cache.lotterietus.status": ReturnType<typeof createServerCache<void, LotterietusViewModel>>;
  }
}

/** 정의 — 조회 조건이 없으므로 캐시키도 하나다. 인스턴스는 컨테이너가 처음 꺼낼 때 짓는다 */
store.cache("cache.lotterietus.status", ({ http }) =>
  createServerCache<void, LotterietusViewModel>(
    () => "lotterietus",
    async () => LotterietusViewModel.from(lotterietusReadResponse(await http.get("/api/lotterietus"))),
  ),
);

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetLotterietusStatusAction() {
  const cache = useStore("cache.lotterietus.status");
  const subscribe = useCallback((fn: () => void) => cache.subscribe(undefined, fn), [cache]);
  const entry = useSyncExternalStore(subscribe, () => cache.read(undefined), readOnServer);
  useEffect(() => cache.ensure(), [cache]);

  return {
    loading: entry === undefined || entry.status === "loading",
    error: entry?.error ?? null,
    status: entry?.value ?? null,
    retry: () => cache.invalidate(),
  };
}
