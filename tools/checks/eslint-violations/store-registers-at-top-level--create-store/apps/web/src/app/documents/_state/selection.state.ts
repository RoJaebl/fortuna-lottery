// 사례: 함수 안에서 createStore 를 부른다 — 불릴 때마다 같은 key 를 다시 등록한다.
import { createStore } from "supa-store";

export function registerSelection() {
  createStore("state.documents.selection", () => ({ ids: [] as string[] }));
}
