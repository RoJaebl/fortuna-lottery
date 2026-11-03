import { createStore } from "supa-store";

/** 고를 수 있는 번호 수 — 여섯째는 자동 채우기가 고른다 */
const MAX_FIXED = 5;

/**
 * 가정 실험실의 입력 — 과거 당첨 조합 제외, 상위 K 제한과 그 K, 과거 비율로 계산할지,
 * 고른 번호(최대 5개), 센 회차의 끝(null 이면 최신), 실험실 재생 바의 배속(통계 탭과 따로 간다)
 */
createStore("state.home.HypothesisLab.switches", (set) => ({
  excludePastWinners: true,
  topKEnabled: true,
  topK: 20,
  pastRateMode: true,
  fixed: [] as number[],
  untilRound: null as number | null,
  playSpeed: 1,
  toggleExcludePastWinners: () => set(({ excludePastWinners }) => ({ excludePastWinners: !excludePastWinners })),
  toggleTopK: () => set(({ topKEnabled }) => ({ topKEnabled: !topKEnabled })),
  changeTopK: (topK: number) => set({ topK }),
  togglePastRateMode: () => set(({ pastRateMode }) => ({ pastRateMode: !pastRateMode })),
  /** 있으면 빼고 없으면 넣는다 — 다섯 개가 찼으면 넣지 않는다 */
  toggleFixed: (n: number) =>
    set(({ fixed }) => {
      if (fixed.includes(n)) return { fixed: fixed.filter((f) => f !== n) };
      return fixed.length < MAX_FIXED ? { fixed: [...fixed, n].sort((a, b) => a - b) } : {};
    }),
  changeUntilRound: (untilRound: number | null) => set({ untilRound }),
  changePlaySpeed: (playSpeed: number) => set({ playSpeed }),
}));
