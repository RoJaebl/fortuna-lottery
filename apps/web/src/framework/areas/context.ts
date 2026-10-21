import type { EventChannel } from "@lib/events";
import type { StoreDeps } from "@lib/store";

/** 컨테이너를 지을 때 영역들이 받는 값 — 콜백 인자(StoreDeps)에 사건 통로를 더한 것. 사건 통로는 event 영역만 쓴다 */
export type AreaContext = StoreDeps & { events: EventChannel };

/** 등록 콜백에 넘기는 인자 — 사건 통로를 뺀다. 콜백은 사건 통로를 직접 부르지 않는다 */
export function depsOf(ctx: AreaContext): StoreDeps {
  const { events: _events, ...deps } = ctx;
  return deps;
}
