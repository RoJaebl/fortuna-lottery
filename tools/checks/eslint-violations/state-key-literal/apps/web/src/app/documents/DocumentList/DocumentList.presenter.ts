// 사례: key 를 상수에 담아 넘긴다 — 자리와 범위를 판정할 문자열이 없다.
declare function useStoreState(key: string): [unknown, unknown];
const SELECTION = "state.documents.selection";
export function useDocumentListPresenter() {
  const [selected] = useStoreState(SELECTION);
  return { selected };
}
