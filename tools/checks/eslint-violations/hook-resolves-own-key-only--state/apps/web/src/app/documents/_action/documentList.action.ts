// 사례: action 의 훅이 공통 상태를 useStore 로 꺼낸다 — 공통 상태는 presenter 가 useStoreState 로 꺼낸다.
declare const store: { cache(key: string, make: () => unknown): void };
declare function useStore(key: string): unknown;

store.cache("cache.documents.list", () => ({}));

export function useDocumentListAction() {
  return useStore("state.documents.selection");
}
