// React 를 import 하지 않는다 — 서버 컴포넌트 그래프와 middleware 에서도 평가된다
import { createStore, type ContainerOf, type EmitOf, type EventChannel, type KeysIn } from "./store";

/** key 와 그 값의 타입 — 각 파일이 declare module "@lib/store" 로 덧붙인다. store 자신은 비워 둔다 */
export interface StoreRegistry {}

/** 등록 콜백이 받는 인자 — infrastructure 의 각 묶음이 덧붙인다. 사건 통로는 여기 들지 않는다 */
export interface StoreDeps {}

export type { EventChannel };
export type KeyOf<A extends "cache" | "http" | "event" | "route"> = KeysIn<StoreRegistry, A>;
export type Emit = EmitOf<StoreRegistry>;
export type ContainerDeps = StoreDeps & { events: EventChannel };
export type Container<D extends ContainerDeps = ContainerDeps> = ContainerOf<StoreRegistry, D>;

export const { store, route } = createStore<StoreRegistry, StoreDeps>();
