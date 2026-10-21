// 사례: 새 라이브러리의 훅을 다른 이름으로 가져온다 — key 검사가 그 호출을 보지 못한다.
import { useSharedState as useS } from "@fortuna-lottery/store/react";
export function useDocumentListPresenter() {
  const selected = useS("state.documents.selection", (s) => s);
  return { selected };
}
