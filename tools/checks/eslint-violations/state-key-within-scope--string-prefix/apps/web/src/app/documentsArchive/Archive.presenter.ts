// 사례: 글자로만 앞부분인 key 를 꺼낸다 — 앞부분은 마디 단위로 잰다.
import { useStore } from "@fortuna-lottery/store/react";
export function useArchivePresenter() {
  const selected = useStore("state.documents.selection");
  return { selected };
}
