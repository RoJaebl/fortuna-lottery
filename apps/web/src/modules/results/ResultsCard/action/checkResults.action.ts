import { useSyncExternalStore } from "react";
import { fetchJson } from "@/shared/lib/fetchJson";
import { createServerCache } from "@/shared/lib/serverCache";
import type { ResultsDrawModel } from "../../model/ResultsCheck.model";
import { ResultsCheckItemViewModel } from "../../model/ResultsCheckItem.viewmodel";
import { checkResultsResponse } from "../mapper/checkResults.mapper";

interface ResultsCheckState {
  draw: ResultsDrawModel | null;
  items: ResultsCheckItemViewModel[];
}

/**
 * 이 유스케이스의 캐시 — 앱에 하나다. 조회 조건이 없으므로(현재 사용자의 픽 전부) 캐시키도 하나다.
 * 화면이 떠도 받지 않고 사람이 「당첨 대조」를 누를 때 받는다 — 누를 때마다 다시 받는다(옛 화면 그대로).
 * 픽을 저장·삭제해도 이 캐시를 무효화하지 않는다 — 옛 화면도 다시 누르기 전까지 앞선 결과를 보였다.
 * 탭을 옮기면 보는 화면이 없어져 캐시가 값을 놓으므로, 돌아오면 누르기 전 상태다(옛 화면 그대로)
 */
export const checkResultsCache = createServerCache<void, ResultsCheckState>(
  () => "results",
  async () => {
    const model = checkResultsResponse(await fetchJson("/api/results"));
    return { draw: model.draw, items: ResultsCheckItemViewModel.fromMany(model.items) };
  },
);

const subscribe = (fn: () => void) => checkResultsCache.subscribe(undefined, fn);
const read = () => checkResultsCache.read(undefined);
const readOnServer = () => undefined; // 서버에서 그리는 동안에는 받은 값이 없다

export function useCheckResultsAction() {
  const entry = useSyncExternalStore(subscribe, read, readOnServer);

  return {
    pending: entry?.status === "loading",
    error: entry?.error ?? null,
    results: entry?.value ?? null,
    /** 사람이 「당첨 대조」를 눌렀다 — 처음이면 받고, 쥔 값이 있으면 버리고 다시 받는다 */
    check: () => (read() ? checkResultsCache.invalidate() : checkResultsCache.ensure()),
  };
}
