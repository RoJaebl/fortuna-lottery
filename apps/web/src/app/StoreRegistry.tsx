"use client";
import "@composition/store.gen"; // 클라이언트 번들에 정의 파일을 실어 등록을 일으킨다 — 서버 쪽은 layout.tsx 가 싣는다
import type { ReactNode } from "react";

/** 클라이언트 경계 — 생성 파일을 실을 뿐 아무것도 더하지 않는다 */
export function StoreRegistry({ children }: { children: ReactNode }) {
  return children;
}
