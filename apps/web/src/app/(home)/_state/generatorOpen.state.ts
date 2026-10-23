import { createStore } from "@fortuna-lottery/store";

/** 생성기가 열렸는가 — 회차 카드가 바꾸고, 페이지와 회차 카드가 읽는다 */
createStore("state.home.generatorOpen", (set, get) => ({
  open: false,
  toggle: () => set({ open: !get().open }),
}));
