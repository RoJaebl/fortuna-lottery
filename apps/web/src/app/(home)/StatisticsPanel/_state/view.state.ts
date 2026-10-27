import { createStore } from "supa-store";
import type { StatView } from "../StatisticsPanel.presenter";

/**
 * 통계의 활성 보기와 잔디밭 창 — 시작 회차(null 이면 최신 창)와 그리드에 들어가는 칸 수.
 * 칸 수는 화면이 그리드 폭을 잰 뒤 알린다. 재기 전(서버 렌더)에는 100 칸으로 그린다
 */
createStore("state.home.StatisticsPanel.view", (set) => ({
  activeStatView: "sum" as StatView,
  recentStart: null as number | null,
  recentSize: 100,
  changeStatView: (activeStatView: StatView) => set({ activeStatView }),
  changeRecentStart: (recentStart: number) => set({ recentStart }),
  changeRecentSize: (recentSize: number) => set({ recentSize }),
}));
