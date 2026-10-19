"use client";
import { useState, type ReactNode } from "react";
import { ContainerProvider } from "@lib/di";
import { createContainer } from "@composition/createContainer";

/** 앱이 쓰는 컨테이너를 한 번 짓고 아래로 내린다 (frontend-app-layers §5.3) */
export function AppContainer({ children }: { children: ReactNode }) {
  const [container] = useState(() => createContainer("real"));
  return <ContainerProvider container={container}>{children}</ContainerProvider>;
}
