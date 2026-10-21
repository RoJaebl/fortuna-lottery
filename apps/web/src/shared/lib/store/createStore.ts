import { Container } from "@lib/di";

/** 영역 정의 하나 — store 밖에서 짓고 createStore 에 꽂는다. 각 자리의 책임은 frontend-store §2 가 갖는다 */
export interface Area<Def, Value, Ctx> {
  /** 어떤 key 가 이 영역의 것인가 */
  prefix: string;
  /** 정의의 모양 검사 — 틀리면 key 이름을 담아 실패한다 */
  check?(key: string, def: Def): void;
  /** 정의로 인스턴스를 짓는다. 없으면 이 영역의 key 는 컨테이너에서 꺼내지 않는다 */
  build?(def: Def, ctx: Ctx): Value;
  /** store 출력에 이 영역을 찍는 꼴 — key 순으로 정렬된 정의를 받는다. 없으면 key 만 찍는다 */
  describe?(defs: ReadonlyMap<string, Def>): string[];
  /** 컨테이너가 설 때 할 일 — 이 영역의 정의들을 무엇에 거는가 */
  attach?(defs: ReadonlyMap<string, Def>, ctx: Ctx, container: Container): void;
}

export function defineArea<Def, Value, Ctx>(area: Area<Def, Value, Ctx>): Area<Def, Value, Ctx> {
  return area;
}

// 영역마다 정의·값·인자가 달라 any 로 받는다
type AnyArea = Area<any, any, any>;
type DefOf<A> = A extends Area<infer D, unknown, never> ? D : never;
type CtxOf<A> = A extends Area<never, unknown, infer C> ? C : never;
type UnionToIntersection<U> = (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void ? I : never;

/** 꽂힌 영역마다 등록 함수 하나 — 영역 이름이 곧 함수 이름이다 */
export type Store<A extends Record<string, AnyArea>> = {
  [K in keyof A]: (key: string, def: DefOf<A[K]>) => void;
} & {
  /** 등록된 정의 하나 — 등록되지 않은 key 면 key 이름을 담아 실패한다 */
  definition(key: string): unknown;
  /** 등록된 전부 — 영역별로 묶고 key 순으로 정렬한 평문 */
  describe(): string;
  /** 정의에서 di 의 컨테이너를 짓는다. 받은 값을 deps 로 싣는다 */
  container<C extends UnionToIntersection<CtxOf<A[keyof A]>>>(ctx: C): Container & { readonly deps: C };
};

/** 영역들을 꽂아 store 하나를 짓는다. store 는 영역의 이름을 하나도 모른다 */
export function createStore<A extends Record<string, AnyArea>>(areas: A): Store<A> {
  const defs = new Map<string, Map<string, unknown>>(Object.keys(areas).map((name) => [name, new Map()]));
  const missing = (key: string) => new Error(`등록되지 않은 key 다: ${key}`);
  const areaOf = (key: string) => Object.keys(areas).find((name) => key.startsWith(areas[name]!.prefix));
  const sorted = (m: Map<string, unknown>) => new Map([...m].sort(([a], [b]) => (a < b ? -1 : 1)));

  const store: Record<string, unknown> = {};
  for (const [name, area] of Object.entries(areas)) {
    store[name] = (key: string, def: unknown) => {
      if (!key.startsWith(area.prefix)) throw new Error(`${name} 영역의 key 는 ${area.prefix} 로 시작한다: ${key}`);
      area.check?.(key, def);
      const mine = defs.get(name)!;
      if (process.env.NODE_ENV === "production" && mine.has(key)) {
        throw new Error(`같은 key 를 두 번 등록했다: ${key}`);
      }
      mine.set(key, def); // 개발 모드(Fast Refresh·HMR·시험)에서는 뒤의 등록이 앞의 것을 덮어쓴다
    };
  }

  store.definition = (key: string) => {
    const name = areaOf(key);
    if (!name || !defs.get(name)!.has(key)) throw missing(key);
    return defs.get(name)!.get(key);
  };

  store.describe = () =>
    Object.entries(areas)
      .flatMap(([name, area]) => {
        const mine = sorted(defs.get(name)!);
        return [`[${name}]`, ...(area.describe ? area.describe(mine) : [...mine.keys()])];
      })
      .join("\n");

  store.container = (ctx: unknown) => {
    const container = new Container();
    for (const [name, area] of Object.entries(areas)) {
      const build = area.build;
      if (!build) continue;
      for (const [key, def] of defs.get(name)!) container.register(key, () => build(def, ctx));
    }
    for (const [name, area] of Object.entries(areas)) area.attach?.(defs.get(name)!, ctx, container);
    return Object.assign(container, { deps: ctx });
  };

  return store as Store<A>;
}
