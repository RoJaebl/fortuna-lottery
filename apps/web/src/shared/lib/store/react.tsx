"use client";

import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import type { Container, KeyOf, StoreRegistry } from ".";

const Ctx = createContext<Container | null>(null);

export function StoreProvider({
  container,
  children,
}: {
  container: Container;
  children: ReactNode;
}): ReactElement {
  return <Ctx.Provider value={container}>{children}</Ctx.Provider>;
}

/** 화면 쪽이 컨테이너에서 꺼내는 유일한 길 */
export function useStore<K extends KeyOf<"cache"> | KeyOf<"http">>(key: K): StoreRegistry[K] {
  const container = useContext(Ctx);
  if (!container) throw new Error(`StoreProvider 밖에서 꺼냈다: ${key}`);
  return container.resolve(key);
}
