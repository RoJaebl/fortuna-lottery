// 사례: 뷰가 useStore 로 store 를 꺼낸다 — 뷰는 presenter 가 만든 입력 묶음을 받는다.
import { useStore } from "@fortuna-lottery/store/react";
export function DocumentList() {
  const selected = useStore("state.documents.selection");
  return <p>{String(selected)}</p>;
}
