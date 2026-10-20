// 허용 표본: 훅이 같은 파일이 store.cache 로 등록한 key 를 꺼낸다.
declare const store: { cache(key: string, make: () => unknown): void };
declare function useStore(key: string): unknown;

store.cache("cache.documents.list", () => ({}));

export function useDocumentListAction() {
  return useStore("cache.documents.list");
}
