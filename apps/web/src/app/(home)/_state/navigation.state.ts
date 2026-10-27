import { createStore } from "supa-store";
import type { HomeMenuKey, HomeTabKey } from "../Home.presenter";

/** 고른 메뉴와 작업실의 활성 탭 — 페이지 presenter 하나가 읽고 바꾼다 */
createStore("state.home.navigation", (set) => ({
  activeMenu: "workroom" as HomeMenuKey,
  activeTab: "statistics" as HomeTabKey,
  selectMenu: (activeMenu: HomeMenuKey) => set({ activeMenu }),
  selectTab: (activeTab: HomeTabKey) => set({ activeTab }),
}));
