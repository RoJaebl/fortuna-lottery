// @framework — 영역 넷(cache·http·event·route)을 꽂은 store 하나와 route. React 를 import 하지 않는다 — 서버 컴포넌트 그래프와 middleware 에서도 평가된다
// (frontend-store §3). 엔진은 key 를 문자열로만 다루므로, 등록부(StoreRegistry)로 타입을 좁히는 일은 이 층이 한다
import type { Container } from "@lib/di";
import type { EventChannel } from "@lib/events";
import { createStore, type StoreDeps, type StoreRegistry } from "@lib/store";
import { cacheArea, type Invalidatable } from "./areas/cache.area";
import { eventArea, ruleKey, type From } from "./areas/event.area";
import { httpArea } from "./areas/http.area";
import { routeArea } from "./areas/route.area";

export type { From };
export type KeyOf<A extends "cache" | "http" | "event" | "route"> = Extract<
  keyof StoreRegistry,
  `${A}.${string}`
>;
export type Emit = <K extends KeyOf<"event">>(key: K, payload: StoreRegistry[K]) => void;
export type ContainerDeps = StoreDeps & { events: EventChannel };

/** store.container 가 돌려주는 것 — di 의 컨테이너에 지을 때 받은 값을 deps 로 실은 것. 꺼내는 값의 타입은 key 에서 나온다 */
export type Built<D extends ContainerDeps = ContainerDeps> = Omit<Container, "resolve"> & {
  resolve<K extends KeyOf<"cache"> | KeyOf<"http">>(key: K): StoreRegistry[K];
  readonly deps: D;
};

export interface AppStore {
  cache<K extends KeyOf<"cache">>(key: K, build: (deps: StoreDeps) => StoreRegistry[K] & Invalidatable): void;
  http<K extends KeyOf<"http">>(key: K, build: (deps: StoreDeps & { emit: Emit }) => StoreRegistry[K]): void;
  event(key: KeyOf<"event">, meta: { from: From }): void;
  invalidates(event: KeyOf<"event">, cache: KeyOf<"cache">, meta: { from: From }): void;
  unaffected(event: KeyOf<"event">, cache: KeyOf<"cache">, reason: string): void;
  route<K extends KeyOf<"route">>(key: K, build: StoreRegistry[K]): void;
  /** 등록된 전부 — 영역별로 묶고 key 순으로 정렬한 평문 */
  describe(): string;
  /** 정의에서 컨테이너를 짓는다. 부르는 것은 조립 루트 하나다 */
  container<D extends ContainerDeps>(deps: D): Built<D>;
}

/** 영역 넷 — 시험이 같은 영역으로 새 store 를 지을 때도 쓴다 */
export const areas = { cache: cacheArea, http: httpArea, event: eventArea, route: routeArea };

/** 같은 영역으로 store 를 짓는다. 앱은 아래 store 하나만 쓴다 */
export function createAppStore(): { store: AppStore; route: <K extends KeyOf<"route">>(key: K) => StoreRegistry[K] } {
  const base = createStore(areas);
  const store: AppStore = {
    cache: (key, build) => base.cache(key, build),
    http: (key, build) => base.http(key, build as never),
    event: (key, meta) => base.event(key, { kind: "event", from: meta.from }),
    invalidates: (event, cache, meta) =>
      base.event(ruleKey(event, cache), { kind: "invalidates", event, cache, from: meta.from }),
    unaffected: (event, cache, reason) =>
      base.event(ruleKey(event, cache), { kind: "unaffected", event, cache, reason }),
    route: (key, build) => base.route(key, build as never),
    describe: () => base.describe(),
    container: (deps) => base.container(deps as never) as unknown as Built<typeof deps>,
  };
  const route = <K extends KeyOf<"route">>(key: K) => base.definition(key) as StoreRegistry[K];
  return { store, route };
}

/** 앱의 store 와 주소 함수 — route 는 공급자 없이 부르는 순수 함수다 (frontend-store §5) */
export const { store, route } = createAppStore();
