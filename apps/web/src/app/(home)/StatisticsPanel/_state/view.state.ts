import { createStore } from "supa-store";
import type { StatView, SumAxisMode } from "../StatisticsPanel.presenter";

/**
 * 통계의 활성 보기와 잔디밭 창 — 시작 회차(null 이면 최신 창)와 그리드에 들어가는 칸 수.
 * 칸 수는 화면이 그리드 폭을 잰 뒤 알린다. 재기 전(서버 렌더)에는 100 칸으로 그린다.
 * 합계 분포는 1회부터 sumUntil 번째 회차까지 쌓은 것을 보인다 — null 이면 최신 회차까지다.
 * 합계 축은 상대 길이(쌓은 회차의 최소~최대)와 절대 길이(이론 범위 21~255) 가운데 하나다
 */
createStore("state.home.StatisticsPanel.view", (set) => ({
  activeStatView: "sum" as StatView,
  recentStart: null as number | null,
  recentSize: 100,
  sumUntil: null as number | null,
  sumAxis: "relative" as SumAxisMode,
  /** 잔디밭과 합계 분포의 재생 배속 — 둘이 함께 쓴다 */
  playSpeed: 1,
  changeStatView: (activeStatView: StatView) => set({ activeStatView }),
  changeRecentStart: (recentStart: number) => set({ recentStart }),
  changeRecentSize: (recentSize: number) => set({ recentSize }),
  changeSumUntil: (sumUntil: number) => set({ sumUntil }),
  changeSumAxis: (sumAxis: SumAxisMode) => set({ sumAxis }),
  changePlaySpeed: (playSpeed: number) => set({ playSpeed }),
}));
