import { defineArea, type StoreDeps } from "@lib/store";
import { depsOf, type AreaContext } from "./context";

/** cache 영역의 값이 지키는 약속 — 전파 규칙이 캐시 인스턴스 전체를 무효화한다. createServerCache 가 이것을 지킨다 */
export type Invalidatable = { invalidate(): void };

export type CacheDef = (deps: StoreDeps) => Invalidatable;

export const cacheArea = defineArea<CacheDef, Invalidatable, AreaContext>({
  prefix: "cache.",
  check(key, def) {
    if (typeof def !== "function") throw new Error(`cache 영역의 정의는 짓는 함수다: ${key}`);
  },
  build: (def, ctx) => def(depsOf(ctx)),
});
