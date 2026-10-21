// 사례: 뷰가 공통 상태를 꺼낸다 — 뷰는 presenter 가 만든 입력 묶음을 받는다.
import { useSharedState } from "@fortuna-lottery/store/react";
export function DocumentList() {
  const selected = useSharedState("state.documents.selection", (s) => s);
  return <p>{String(selected)}</p>;
}
