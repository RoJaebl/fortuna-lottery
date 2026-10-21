import { defineArea } from "@lib/store";

/** route 영역 — 주소 함수를 쥘 뿐이다. 컨테이너에서 꺼내지 않고 route(key) 가 정의를 그대로 돌려준다 */
export const routeArea = defineArea<(...args: never[]) => string, never, unknown>({
  prefix: "route.",
  check(key, def) {
    if (typeof def !== "function") throw new Error(`route 영역의 정의는 주소 함수다: ${key}`);
  },
});
