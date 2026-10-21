// 사례: 훅을 다른 이름으로 가져온다 — key 검사가 그 호출을 보지 못한다.
import { useStore as useResolve } from "@framework/react";
export function useDocumentListPresenter() {
  const list = useResolve("cache.documents.list");
  return { list };
}
