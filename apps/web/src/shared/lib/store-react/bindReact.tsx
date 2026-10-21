"use client";

import { createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode } from "react";

/** 공급자가 내리는 것 — store 가 지은 컨테이너의 모양만 안다 */
export interface Resolver {
  resolve(key: string): unknown;
}

/** useStoreState 가 기대는 상태 부품의 모양 — store 를 import 하지 않으므로 모양으로만 받는다 */
interface Cell {
  readonly initial: unknown;
  get(): unknown;
  subscribe(fn: () => void): () => void;
  readonly actions: unknown;
}

const whole = (value: unknown) => value;

/** store 하나에 묶인 공급자와 훅을 돌려준다. 영역의 이름과 뜻을 모른다 — 타입은 쓰는 쪽(규약 층)이 좁힌다 */
export function bindReact(_store: object) {
  const Ctx = createContext<Resolver | null>(null);

  function StoreProvider({ container, children }: { container: Resolver; children: ReactNode }): ReactElement {
    return <Ctx.Provider value={container}>{children}</Ctx.Provider>;
  }

  function useResolved(key: string): unknown {
    const container = useContext(Ctx);
    if (!container) throw new Error(`StoreProvider 밖에서 꺼냈다: ${key}`);
    return container.resolve(key);
  }

  const useStore = (key: string): unknown => useResolved(key);

  /** [고른 값, 바꾸는 함수들] — 선택자를 주면 고른 값이 바뀔 때만 다시 그린다(Object.is). 서버 렌더는 초기값이다 */
  function useStoreState(key: string, select: (value: never) => unknown = whole): [unknown, unknown] {
    const cell = useResolved(key) as Cell;
    const pick = select as (value: unknown) => unknown;
    const value = useSyncExternalStore(
      cell.subscribe,
      () => pick(cell.get()),
      () => pick(cell.initial),
    );
    return [value, cell.actions];
  }

  return { StoreProvider, useStore, useStoreState };
}
