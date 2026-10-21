// 사례: 훅을 다른 이름으로 가져온다 — key 검사가 그 호출을 보지 못한다.
import { useStoreState as useShared } from "@framework/react";
export function useDocumentListPresenter() {
  const [selected] = useShared("state.documents.selection");
  return { selected };
}
