import { store, type StateDef } from "@framework";

/** 생성기가 열렸는가 — 회차 카드가 바꾸고, 페이지와 회차 카드가 읽는다 */
const generatorOpen = {
  initial: false as boolean,
  actions: {
    toggle: (now) => !now,
  },
} satisfies StateDef<boolean>;

declare module "@lib/store" {
  interface StoreRegistry {
    "state.home.generatorOpen": typeof generatorOpen;
  }
}

store.state("state.home.generatorOpen", generatorOpen);
