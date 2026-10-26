// 사례: key 를 상수에 담아 넘긴다 — 자리와 범위를 판정할 문자열이 없다.
import { useStore } from "supa-store/react";
const SELECTION = "state.documents.selection";
export function useDocumentListPresenter() {
  const selected = useStore(SELECTION);
  return { selected };
}
