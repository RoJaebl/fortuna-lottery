// 사례: 형제 라우트의 공통 상태를 꺼낸다 — documents.[id] 는 documents.new 의 앞부분이 아니다.
declare function useStoreState(key: string): [unknown, unknown];
export function useNewDocumentPresenter() {
  const [panel] = useStoreState("state.documents.[id].panel");
  return { panel };
}
