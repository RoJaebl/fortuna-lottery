// 허용 표본: 시험이 it 안에서 시험용 key 를 등록한다 — 시험은 등록 자리 검사 둘(state-registers-in-state-folder·store-registers-at-top-level)에서 빠진다.
import { createStore } from "supa-store";
it("시험용 store 를 등록한다", () => {
  createStore("state.home.PicksCard.draft", () => ({ value: 1 }));
});
