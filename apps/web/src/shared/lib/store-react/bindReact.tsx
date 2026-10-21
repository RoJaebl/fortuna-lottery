"use client";

import { createContext, useContext, type ReactElement, type ReactNode } from "react";

/** 공급자가 내리는 것 — store 가 지은 컨테이너의 모양만 안다 */
export interface Resolver {
  resolve(key: string): unknown;
}

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

  return { StoreProvider, useStore };
}
