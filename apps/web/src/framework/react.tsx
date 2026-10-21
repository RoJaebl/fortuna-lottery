"use client";
// @framework/react — 규약 층의 store 하나에 묶인 공급자와 훅. 서버 쪽에서 평가되는 파일은 이것을 보지 않는다 (frontend-store §3)
import type { ReactElement, ReactNode } from "react";
import { bindReact } from "@lib/store-react";
import type { BoundActions, StoreRegistry } from "@lib/store";
import { store, type Built, type KeyOf } from ".";

type ValueOf<D> = D extends { initial: infer V } ? V : never;
type ActionsOf<D> = D extends { actions: infer A } ? BoundActions<A> : never;

const bound = bindReact(store);

export const StoreProvider = bound.StoreProvider as (props: { container: Built; children: ReactNode }) => ReactElement;

/** action 의 훅이 자기 파일이 등록한 cache·http key 하나를 꺼내는 길 */
export const useStore = bound.useStore as <K extends KeyOf<"cache"> | KeyOf<"http">>(key: K) => StoreRegistry[K];

/** presenter 가 공통 상태를 꺼내는 길 — [값, 바꾸는 함수들]. 선택자를 주면 고른 값만 구독한다 */
export const useStoreState = bound.useStoreState as {
  <K extends KeyOf<"state">>(key: K): [ValueOf<StoreRegistry[K]>, ActionsOf<StoreRegistry[K]>];
  <K extends KeyOf<"state">, T>(
    key: K,
    select: (value: ValueOf<StoreRegistry[K]>) => T,
  ): [T, ActionsOf<StoreRegistry[K]>];
};
