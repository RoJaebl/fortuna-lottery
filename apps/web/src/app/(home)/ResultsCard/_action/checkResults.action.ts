import { useCallback, useSyncExternalStore } from "react";
import { store } from "@lib/store";
import { useStore } from "@lib/store/react";
import { createServerCache } from "@infrastructure/serverCache";
import { ResultsDrawViewModel } from "../_model/ResultsDraw.viewmodel";
import { ResultsCheckItemViewModel } from "../_model/ResultsCheckItem.viewmodel";
import { resultsCheckResponse } from "../_mapper/resultsCheck.mapper";

interface ResultsCheckState {
  draw: ResultsDrawViewModel | null;
  items: ResultsCheckItemViewModel[];
}

declare module "@lib/store" {
  interface StoreRegistry {
    "cache.results.check": ReturnType<typeof createServerCache<void, ResultsCheckState>>;
  }
}

/**
 * 정의 — 조회 조건이 없으므로(현재 사용자의 픽 전부) 캐시키도 하나다.
 * 화면이 떠도 받지 않고 사람이 「당첨 대조」를 누를 때 받는다 — 누를 때마다 다시 받는다(옛 화면 그대로).
 * 탭을 옮기면 보는 화면이 없어져 캐시가 값을 놓으므로, 돌아오면 누르기 전 상태다(옛 화면 그대로)
 */
store.cache("cache.results.check", ({ http }) =>
  createServerCache<void, ResultsCheckState>(
    () => "results",
    async () => {
      const model = resultsCheckResponse(await http.get("/api/results"));
      return { draw: model.draw ? ResultsDrawViewModel.from(model.draw) : null, items: ResultsCheckItemViewModel.fromMany(model.items) };
    },
  ),
);

/** 픽 저장·삭제는 이 캐시를 낡게 하지 않는다 — 그 판단도 낡는 쪽인 이 파일에 둔다 */
store.unaffected("event.picks.saved", "cache.results.check", "결과는 사람이 「당첨 대조」를 눌러 받는다");
store.unaffected("event.picks.removed", "cache.results.check", "결과는 사람이 「당첨 대조」를 눌러 받는다");

const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useCheckResultsAction() {
  const cache = useStore("cache.results.check");
  const subscribe = useCallback((fn: () => void) => cache.subscribe(undefined, fn), [cache]);
  const entry = useSyncExternalStore(subscribe, () => cache.read(undefined), readOnServer);

  return {
    pending: entry?.status === "loading",
    error: entry?.error ?? null,
    results: entry?.value ?? null,
    /** 사람이 「당첨 대조」를 눌렀다 — 처음이면 받고, 쥔 값이 있으면 버리고 다시 받는다 */
    check: () => (cache.read(undefined) ? cache.invalidate() : cache.ensure()),
  };
}
