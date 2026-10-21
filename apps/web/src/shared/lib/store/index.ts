// @lib/store — 영역 정의를 받는 엔진. React 를 import 하지 않는다. 영역의 이름을 하나도 모른다 (frontend-store §1)

/** key 와 그 값의 타입 — 각 파일이 declare module "@lib/store" 로 덧붙인다. store 자신은 비워 둔다 */
export interface StoreRegistry {}

/** 영역의 짓는 법이 받는 콜백 인자 — infrastructure 의 각 묶음이 덧붙인다. 사건 통로는 여기 들지 않는다 */
export interface StoreDeps {}

export { createStore, defineArea, type Area, type Store } from "./createStore";
export { createState, type BoundActions, type StateActions, type StateCell, type StateDef } from "./state";
