// store 의 상태 부품 — 값 하나와 구독, 그리고 이름 붙은 바꾸는 함수. 영역이 이것을 불러 상태를 짓는다

/** 바꾸는 함수 — 지금 값과 인자를 받아 다음 값을 돌려주는 순수 함수다. 값을 통째로 덮는 길은 열지 않는다 */
// 인자의 꼴은 함수마다 달라 any 로 받는다
export type StateActions<V> = Record<string, (now: V, ...args: any[]) => V>;

/** 상태 하나의 정의 — 값 타입·초기값·이름 붙은 바꾸는 함수 */
export interface StateDef<V, A extends StateActions<V> = StateActions<V>> {
  initial: V;
  actions: A;
}

/** 바꾸는 함수에서 지금 값을 뺀 것 — 쓰는 쪽은 인자만 넘긴다 */
export type BoundActions<A> = {
  [K in keyof A]: A[K] extends (now: never, ...args: infer P) => unknown ? (...args: P) => void : never;
};

export interface StateCell<V, A> {
  readonly initial: V;
  get(): V;
  subscribe(fn: () => void): () => void;
  readonly actions: BoundActions<A>;
}

export function createState<V, A extends StateActions<V>>(def: StateDef<V, A>): StateCell<V, A> {
  let value = def.initial;
  const watchers = new Set<() => void>();
  const actions = Object.fromEntries(
    Object.entries(def.actions).map(([name, next]) => [
      name,
      (...args: unknown[]) => {
        const after = next(value, ...args);
        if (Object.is(after, value)) return;
        value = after;
        watchers.forEach((fn) => fn());
      },
    ]),
  ) as BoundActions<A>;

  return {
    initial: def.initial,
    get: () => value,
    subscribe(fn) {
      watchers.add(fn);
      return () => {
        watchers.delete(fn);
      };
    },
    actions,
  };
}
