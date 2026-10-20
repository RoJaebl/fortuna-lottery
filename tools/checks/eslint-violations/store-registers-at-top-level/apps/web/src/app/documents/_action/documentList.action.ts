// 사례: 훅 안에서 store.cache 를 부른다 — 불릴 때마다 같은 key 를 다시 등록한다.
declare const store: { cache(key: string, make: () => unknown): void };

export function useDocumentListAction() {
  store.cache("cache.documents.list", () => ({}));
  return null;
}
