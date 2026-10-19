import { useCallback, useEffect, useSyncExternalStore } from "react";
import { token, useResolve } from "@lib/di";
import type { HttpClient } from "@infrastructure/http";
import { createServerCache } from "@infrastructure/serverCache";
import type { PopularityViewModel } from "../model/Popularity.viewmodel";
import { hypothesisPopularityRequest, hypothesisPopularityResponse } from "../mapper/hypothesisPopularity.mapper";

/** 이 유스케이스의 토큰 — 조립 루트가 이 토큰에 캐시를 한 번 짓는다 */
export const CHECK_POPULARITY = token<ReturnType<typeof createPopularityCache>>("checkPopularity");

/**
 * 짓는 법 — 조건은 조합 문자열(`"1,2,3,4,5,6"`)이고 그것이 곧 캐시키다.
 * 조합이 바뀌면 앞 조합을 보는 화면이 없어지므로, 늦게 온 앞 응답은 캐시 도구가 버린다.
 */
export function createPopularityCache(http: HttpClient) {
  return createServerCache<string, PopularityViewModel>(
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
  );
}

const noop = () => {};
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

/** 인기 패턴 — 현재 조합이 바뀔 때마다 다시 묻는다. 조합이 없으면 묻지 않는다 */
export function useCheckPopularityAction(numbers: number[] | null) {
  const cache = useResolve(CHECK_POPULARITY);
  // 배열의 정체가 아니라 내용이 바뀔 때만 다시 묻는다 — 렌더마다 새 배열을 넘겨도 요청이 되풀이되지 않는다
  const key = numbers ? numbers.join(",") : null;
  const subscribe = useCallback((fn: () => void) => (key === null ? noop : cache.subscribe(key, fn)), [cache, key]);
  const entry = useSyncExternalStore(subscribe, () => (key === null ? undefined : cache.read(key)), readOnServer);
  useEffect(() => {
    if (key !== null) cache.ensure(key);
  }, [cache, key]);

  return { result: entry?.value ?? null, error: entry?.error ?? null };
}
