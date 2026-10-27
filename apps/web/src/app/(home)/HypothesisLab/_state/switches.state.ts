import { createStore } from "supa-store";

/** 가정 실험실의 스위치 셋 — 과거 당첨 조합 제외, 상위 K 제한과 그 K */
createStore("state.home.HypothesisLab.switches", (set) => ({
  excludePastWinners: true,
  topKEnabled: true,
  topK: 20,
  toggleExcludePastWinners: () => set(({ excludePastWinners }) => ({ excludePastWinners: !excludePastWinners })),
  toggleTopK: () => set(({ topKEnabled }) => ({ topKEnabled: !topKEnabled })),
  changeTopK: (topK: number) => set({ topK }),
}));
