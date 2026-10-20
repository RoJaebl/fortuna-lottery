// 사례: action 의 훅이 주소 key 를 useStore 로 꺼낸다 — 주소는 route(key) 로 만든다.
declare const store: { cache(key: string, make: () => unknown): void };
declare function useStore(key: string): unknown;

store.cache("cache.documents.list", () => ({}));

export function useDocumentListAction() {
  return useStore("route.documents.detail");
}
