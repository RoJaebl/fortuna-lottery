/** event 영역이 거는 약속 — 컨테이너에 넘기는 사건 통로가 이 모양을 갖는다 */
export interface EventChannel {
  on(name: string, fn: (payload: unknown) => void): () => void;
  emit(name: string, payload?: unknown): void;
}

export type Area = "cache" | "http" | "event" | "route";
export type KeysIn<R, A extends Area> = Extract<keyof R, `${A}.${string}`>;
export type From = "tab" | "server";
export type EmitOf<R> = <K extends KeysIn<R, "event">>(key: K, payload: R[K]) => void;
type Invalidatable = { invalidate(): void };

export interface ContainerOf<R, D> {
  readonly deps: D;
  resolve<K extends KeysIn<R, "cache"> | KeysIn<R, "http">>(key: K): R[K];
}

export interface Store<R extends object, D extends object> {
  cache<K extends KeysIn<R, "cache">>(key: K, build: (deps: D) => R[K] & Invalidatable): void;
  http<K extends KeysIn<R, "http">>(key: K, build: (deps: D & { emit: EmitOf<R> }) => R[K]): void;
  event(key: KeysIn<R, "event">, meta: { from: From }): void;
  invalidates(event: KeysIn<R, "event">, cache: KeysIn<R, "cache">, meta: { from: From }): void;
  unaffected(event: KeysIn<R, "event">, cache: KeysIn<R, "cache">, reason: string): void;
  route<K extends KeysIn<R, "route">>(key: K, build: R[K]): void;
  /** 등록된 전부 — 영역별로 묶고 key 순으로 정렬한 평문 */
  describe(): string;
  /** 정의에서 컨테이너를 짓는다. 사건 통로는 deps.events 로 받는다 */
  container<C extends D & { events: EventChannel }>(deps: C): ContainerOf<R, C>;
}

// 내부 맵은 key 로 타입을 잃으므로 꺼내는 자리에서만 되돌린다
export function createStore<R extends object, D extends object>(): {
  store: Store<R, D>;
  route: <K extends KeysIn<R, "route">>(key: K) => R[K];
} {
  const caches = new Map<string, (deps: never) => Invalidatable>();
  const https = new Map<string, (deps: never) => unknown>();
  const events = new Map<string, From>();
  const rules = new Map<string, { event: string; cache: string; from: From }>();
  const unaffecteds = new Map<string, { event: string; cache: string; reason: string }>();
  const routes = new Map<string, unknown>();

  const put = <V>(map: Map<string, V>, key: string, value: V) => {
    if (process.env.NODE_ENV === "production" && map.has(key)) {
      throw new Error(`같은 key 를 두 번 등록했다: ${key}`);
    }
    map.set(key, value);
  };
  const missingKey = (key: string) => new Error(`등록되지 않은 key 다: ${key}`);
  const missingEvent = (key: string) => new Error(`등록되지 않은 사건이다: ${key}`);

  const route = <K extends KeysIn<R, "route">>(key: K): R[K] => {
    if (!routes.has(key)) throw missingKey(key);
    return routes.get(key) as R[K];
  };

  const store: Store<R, D> = {
    cache: (key, build) => put(caches, key, build as (deps: never) => Invalidatable),
    http: (key, build) => put(https, key, build as (deps: never) => unknown),
    event: (key, meta) => put(events, key, meta.from),
    invalidates: (event, cache, meta) =>
      put(rules, `${event} ${cache}`, { event, cache, from: meta.from }),
    unaffected: (event, cache, reason) =>
      put(unaffecteds, `${event} ${cache}`, { event, cache, reason }),
    route: (key, build) => put(routes, key, build),

    describe() {
      const keys = (m: Map<string, unknown>) => [...m.keys()].sort();
      const lines = ["[cache]", ...keys(caches), "[http]", ...keys(https), "[event]"];
      for (const event of keys(events)) {
        lines.push(`${event} (from: ${events.get(event)})`);
        const mine = <T extends { event: string; cache: string }>(m: Map<string, T>) =>
          [...m.values()].filter((r) => r.event === event).sort((a, b) => (a.cache < b.cache ? -1 : 1));
        for (const r of mine(rules)) lines.push(`  낡게 한다: ${r.cache} (from: ${r.from})`);
        for (const r of mine(unaffecteds)) {
          lines.push(`  일부러 낡게 하지 않는다: ${r.cache} — ${r.reason}`);
        }
      }
      lines.push("[route]", ...keys(routes));
      return lines.join("\n");
    },

    container(deps) {
      for (const r of rules.values()) {
        if (!events.has(r.event)) throw missingEvent(r.event);
        if (!caches.has(r.cache)) throw missingKey(r.cache);
      }
      const { events: channel, ...rest } = deps;
      const instances = new Map<string, unknown>();
      const emit = (key: string, payload: unknown) => {
        if (!events.has(key)) throw missingEvent(key);
        channel.emit(key, payload);
      };
      const resolve = (key: string) => {
        if (!instances.has(key)) {
          const buildCache = caches.get(key);
          const buildHttp = https.get(key);
          if (buildCache) instances.set(key, buildCache(rest as never));
          else if (buildHttp) instances.set(key, buildHttp({ ...rest, emit } as never));
          else throw missingKey(key);
        }
        return instances.get(key);
      };
      for (const r of rules.values()) {
        // 이미 지어진 캐시만 무효화한다 — 아무도 꺼내지 않은 캐시를 사건 때문에 짓지 않는다
        channel.on(r.event, () => (instances.get(r.cache) as Invalidatable | undefined)?.invalidate());
      }
      return { deps, resolve: resolve as ContainerOf<R, typeof deps>["resolve"] };
    },
  };
  return { store, route };
}
