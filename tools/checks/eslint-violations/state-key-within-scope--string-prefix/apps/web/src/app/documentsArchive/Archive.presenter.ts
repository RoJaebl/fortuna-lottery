// 사례: 글자로만 앞부분인 key 를 꺼낸다 — 앞부분은 마디 단위로 잰다.
import { useSharedState } from "@fortuna-lottery/store/react";
export function useArchivePresenter() {
  const selected = useSharedState("state.documents.selection", (s) => s);
  return { selected };
}
