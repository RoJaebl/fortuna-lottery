import { store, type StateDef } from "@framework";

/** 지금 고른 조합 — 생성기와 가정 실험실이 바꾸고, 통계·시뮬레이션·내 번호·가정 실험실이 읽는다 */
const combination = {
  initial: null as number[] | null,
  actions: {
    choose: (_now, numbers: number[]) => numbers,
  },
} satisfies StateDef<number[] | null>;

declare module "@lib/store" {
  interface StoreRegistry {
    "state.home.combination": typeof combination;
  }
}

store.state("state.home.combination", combination);
