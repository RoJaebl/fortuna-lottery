import { createStore } from "supa-store";
import type { StatView } from "../StatisticsPanel.presenter";

/** 통계의 활성 보기와 잔디밭 타임라인의 시작 회차 — null 이면 마지막 창이다 */
createStore("state.home.StatisticsPanel.view", (set) => ({
  activeStatView: "sum" as StatView,
  recentStart: null as number | null,
  changeStatView: (activeStatView: StatView) => set({ activeStatView }),
  changeRecentStart: (recentStart: number) => set({ recentStart }),
}));
