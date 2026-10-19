import { useCallback, useEffect, useSyncExternalStore } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { createServerCache } from "@infrastructure/serverCache";
import { LotterietusViewModel } from "../model/Lotterietus.viewmodel";
import { lotterietusReadResponse } from "../mapper/lotterietusRead.mapper";

/** 이 유스케이스의 토큰 — 조립 루트가 이 토큰에 캐시를 한 번 짓는다 */
export const LOTTERIETUS_STATUS = token<ReturnType<typeof createLotterietusStatusCache>>("lotterietusStatus");

/** 짓는 법 — 조회 조건이 없으므로 캐시키도 하나다 */
export function createLotterietusStatusCache(http: HttpClient) {
  return createServerCache<void, LotterietusViewModel>(
    () => "lotterietus",
    async () => LotterietusViewModel.from(lotterietusReadResponse(await http.get("/api/lotterietus"))),
  );
}

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetLotterietusStatusAction() {
  const cache = useResolve(LOTTERIETUS_STATUS);
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
