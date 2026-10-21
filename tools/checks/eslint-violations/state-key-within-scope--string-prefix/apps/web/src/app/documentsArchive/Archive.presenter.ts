// 사례: 글자로만 앞부분인 key 를 꺼낸다 — 앞부분은 마디 단위로 잰다.
declare function useStoreState(key: string): [unknown, unknown];
export function useArchivePresenter() {
  const [selected] = useStoreState("state.documents.selection");
  return { selected };
}
