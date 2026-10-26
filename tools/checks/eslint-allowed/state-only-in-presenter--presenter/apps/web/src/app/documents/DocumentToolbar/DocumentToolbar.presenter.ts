// 허용 표본: presenter 가 자기 폴더의 조상이 정의한 공통 상태를 꺼내고 바꾼다.
import { useStore } from "supa-store/react";
export function useDocumentToolbarPresenter() {
  const clear = useStore("state.documents.selection", { pick: ["clear"] }).clear;
  return { clear };
}
