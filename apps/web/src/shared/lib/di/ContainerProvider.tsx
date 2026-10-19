"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Container, Token } from "./container";

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

/** 화면 쪽이 컨테이너에서 꺼내는 유일한 길 — action 훅의 맨 앞에서 자기 유스케이스 토큰 하나를 꺼낸다 */
export function useResolve<T>(t: Token<T>): T {
  const container = useContext(ContainerContext);
  if (!container) throw new Error(`ContainerProvider 밖에서 꺼냈다: ${t.name}`);
  return container.resolve(t);
}
