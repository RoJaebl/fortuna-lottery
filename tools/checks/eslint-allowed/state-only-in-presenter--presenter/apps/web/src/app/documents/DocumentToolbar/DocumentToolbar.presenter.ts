// 허용 표본: presenter 가 자기 폴더의 조상이 정의한 공통 상태를 꺼내고 바꾼다.
import { useStoreState } from "@framework/react";
export function useDocumentToolbarPresenter() {
  const [, selection] = useStoreState("state.documents.selection");
  return { clear: () => (selection as { clear(): void }).clear() };
}
