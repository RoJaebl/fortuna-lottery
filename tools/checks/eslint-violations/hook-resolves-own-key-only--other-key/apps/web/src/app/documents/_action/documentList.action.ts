// 사례: action 의 훅이 다른 파일이 등록한 캐시 key 를 꺼낸다 — 훅은 이 파일이 등록한 key 만 꺼낸다.
declare const store: { cache(key: string, make: () => unknown): void };
declare function useStore(key: string): unknown;

store.cache("cache.documents.list", () => ({}));

export function useDocumentListAction() {
  return useStore("cache.documents.stats");
}
