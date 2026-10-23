import { createStore } from "@fortuna-lottery/store";

/** 지금 고른 조합 — 생성기와 가정 실험실이 바꾸고, 통계·시뮬레이션·내 번호·가정 실험실이 읽는다 */
createStore("state.home.combination", (set) => ({
  numbers: null as number[] | null,
  choose: (numbers: number[]) => set({ numbers }),
}));
