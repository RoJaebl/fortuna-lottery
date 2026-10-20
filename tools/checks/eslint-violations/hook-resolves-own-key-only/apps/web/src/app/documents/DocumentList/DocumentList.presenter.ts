// 사례: 조정자가 store 에서 직접 꺼낸다 — 꺼내는 것은 action 의 훅뿐이다.
declare function useStore(key: string): unknown;

export function useDocumentListPresenter() {
  return useStore("cache.documents.list");
}
