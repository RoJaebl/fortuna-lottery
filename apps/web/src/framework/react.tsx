"use client";
// @framework/react — 규약 층의 store 하나에 묶인 공급자와 훅. 서버 쪽에서 평가되는 파일은 이것을 보지 않는다 (frontend-store §3)
import type { ReactElement, ReactNode } from "react";
import { bindReact } from "@lib/store-react";
import type { StoreRegistry } from "@lib/store";
import { store, type Built, type KeyOf } from ".";

const bound = bindReact(store);

export const StoreProvider = bound.StoreProvider as (props: { container: Built; children: ReactNode }) => ReactElement;

/** action 의 훅이 자기 파일이 등록한 cache·http key 하나를 꺼내는 길 */
export const useStore = bound.useStore as <K extends KeyOf<"cache"> | KeyOf<"http">>(key: K) => StoreRegistry[K];
