import { useEffect, useSyncExternalStore } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { createServerCache } from "@/shared/lib/serverCache";
import { LotterietusViewModel } from "../../model/Lotterietus.viewmodel";
import { getLotterietusStatusResponse } from "../mapper/getLotterietusStatus.mapper";

/** 이 유스케이스의 캐시 — 앱에 하나다. 조회 조건이 없으므로 캐시키도 하나다 */
export const lotterietusStatusCache = createServerCache<void, LotterietusViewModel>(
  () => "lotterietus",
  async () => LotterietusViewModel.from(getLotterietusStatusResponse(await fetchJson("/api/lotterietus"))),
);

const subscribe = (fn: () => void) => lotterietusStatusCache.subscribe(undefined, fn);
const read = () => lotterietusStatusCache.read(undefined);
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useGetLotterietusStatusAction() {
  const entry = useSyncExternalStore(subscribe, read, readOnServer);
  useEffect(() => lotterietusStatusCache.ensure(), []);

  return {
    error: entry?.error ?? null,
    status: entry?.value ?? null,
  };
}
