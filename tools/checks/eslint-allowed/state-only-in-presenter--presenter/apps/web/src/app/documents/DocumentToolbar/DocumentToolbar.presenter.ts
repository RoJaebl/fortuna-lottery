// 허용 표본: presenter 가 자기 폴더의 조상이 정의한 공통 상태를 꺼내고 바꾼다.
import { useSharedState } from "@fortuna-lottery/store/react";
export function useDocumentToolbarPresenter() {
  const clear = useSharedState("state.documents.selection", (s) => s.clear);
  return { clear };
}
