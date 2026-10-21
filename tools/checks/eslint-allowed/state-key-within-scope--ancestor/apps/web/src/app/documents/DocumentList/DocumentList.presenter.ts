// 허용 표본: 조상 폴더가 정의한 공통 상태를 제 이름으로 가져온 훅에 문자열 key 로 꺼낸다.
import { useSharedState } from "@fortuna-lottery/store/react";
export function useDocumentListPresenter() {
  const selected = useSharedState("state.documents.selection", (s) => s);
  return { selected };
}
