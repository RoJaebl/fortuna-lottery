import { useCallback, useEffect, useSyncExternalStore } from "react";
import { store } from "@framework";
import { useStore } from "@framework/react";
import { createServerCache } from "@lib/cache";
import type { PopularityViewModel } from "../_model/Popularity.viewmodel";
import { hypothesisPopularityRequest, hypothesisPopularityResponse } from "../_mapper/hypothesisPopularity.mapper";

declare module "@lib/store" {
  interface StoreRegistry {
    "cache.hypothesis.popularity": ReturnType<typeof createServerCache<string, PopularityViewModel>>;
  }
}

/**
 * 정의 — 조건은 조합 문자열(`"1,2,3,4,5,6"`)이고 그것이 곧 캐시키다.
 * 조합이 바뀌면 앞 조합을 보는 화면이 없어지므로, 늦게 온 앞 응답은 캐시 도구가 버린다.
 */
store.cache("cache.hypothesis.popularity", ({ http }) =>
  createServerCache<string, PopularityViewModel>(
    (key) => key,
    async (key) => {
      try {
        const res = await http.send<Parameters<typeof hypothesisPopularityResponse>[0]>("/api/hypothesis/popularity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hypothesisPopularityRequest(key.split(",").map(Number))),
        });
        return hypothesisPopularityResponse(res);
      } catch (e) {
        throw e instanceof Error ? e : new Error("인기 패턴 확인에 실패했습니다");
      }
    },
  ),
);

const noop = () => {};
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

/** 인기 패턴 — 현재 조합이 바뀔 때마다 다시 묻는다. 조합이 없으면 묻지 않는다 */
export function useCheckPopularityAction(numbers: number[] | null) {
  const cache = useStore("cache.hypothesis.popularity");
  // 배열의 정체가 아니라 내용이 바뀔 때만 다시 묻는다 — 렌더마다 새 배열을 넘겨도 요청이 되풀이되지 않는다
  const key = numbers ? numbers.join(",") : null;
  const subscribe = useCallback((fn: () => void) => (key === null ? noop : cache.subscribe(key, fn)), [cache, key]);
  const entry = useSyncExternalStore(subscribe, () => (key === null ? undefined : cache.read(key)), readOnServer);
  useEffect(() => {
    if (key !== null) cache.ensure(key);
  }, [cache, key]);

  return { result: entry?.value ?? null, error: entry?.error ?? null };
}
