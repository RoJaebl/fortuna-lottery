import { createState, defineArea, type StateCell, type StateDef } from "@lib/store";

/** state 영역 — 여러 presenter 가 함께 쓰는 상태 하나. 컨테이너마다 상태 부품 하나를 짓는다 (frontend-shared-state) */
export const stateArea = defineArea<StateDef<unknown>, StateCell<unknown, never>, unknown>({
  prefix: "state.",
  // key 와 정의 파일의 자리는 검사기(state-key-matches-folder)가 paths.mjs 로 맞댄다 — 여기서는 정의의 모양만 본다
  check(key, def) {
    if (!def || !("initial" in def) || typeof def.actions !== "object") {
      throw new Error(`state 영역의 정의는 { initial, actions } 다: ${key}`);
    }
  },
  build: (def) => createState(def) as StateCell<unknown, never>,
  describe: (defs) =>
    [...defs].flatMap(([key, def]) => [
      `${key} = ${JSON.stringify(def.initial)}`,
      `  바꾸는 함수: ${Object.keys(def.actions).sort().join(", ")}`,
    ]),
});
