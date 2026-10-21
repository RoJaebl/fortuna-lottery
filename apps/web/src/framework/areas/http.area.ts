import { defineArea, type StoreDeps } from "@lib/store";
import { depsOf, type AreaContext } from "./context";
import { emitOf } from "./event.area";

export type HttpDef = (deps: StoreDeps & { emit: (key: string, payload: unknown) => void }) => unknown;

export const httpArea = defineArea<HttpDef, unknown, AreaContext>({
  prefix: "http.",
  check(key, def) {
    if (typeof def !== "function") throw new Error(`http 영역의 정의는 짓는 함수다: ${key}`);
  },
  // emit 은 event 영역이 사건 통로를 감싸 넘기는 통로다 — 영역 사이의 길은 규약 층 안에서 끝난다
  build: (def, ctx) => def({ ...depsOf(ctx), emit: emitOf(ctx) }),
});
