// 사례: presenter 파일이 공통 상태를 등록한다 — 등록은 공통 조상 폴더의 _state/ 파일이 한다.
import { createStore } from "supa-store";
createStore("state.documents.DocumentList.open", () => ({ open: false }));
export function useDocumentListPresenter() {
  return {};
}
