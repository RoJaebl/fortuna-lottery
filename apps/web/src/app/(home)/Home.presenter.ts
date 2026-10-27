import { useStore } from "supa-store/react";
import type { TabItem, TabsProps } from "@ui/Tabs";

export type HomeMenuKey = "workroom";
export type HomeTabKey = "statistics" | "simulation" | "hypothesis";

/** 왼쪽 패널의 메뉴 — 지금은 작업실 하나다 */
const MENU: readonly TabItem<HomeMenuKey>[] = [{ key: "workroom", label: "작업실" }];

/**
 * 작업실 안의 탭 — 각 카드의 기존 title을 탭 라벨로 그대로 사용 (설계 문서 §3).
 * 내 번호·결과 확인은 탭이 아니라 위쪽 번호 영역에 번호 만들기와 함께 늘 펼쳐 둔다
 */
const TABS: readonly TabItem<HomeTabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "hypothesis", label: "가정 실험실" },
];

/**
 * 페이지의 presenter — 고른 메뉴와 작업실의 활성 탭은 _state/ 의 state.home.navigation 이다.
 * 자식이 함께 쓰는 현재 조합도 _state/ 의 공통 상태다 (frontend-shared-state §1)
 */
export function useHomePresenter() {
  const { activeMenu, activeTab, selectMenu, selectTab } = useStore("state.home.navigation");

  const menu = { items: MENU, active: activeMenu, onChange: selectMenu };

  const tabs: TabsProps<HomeTabKey> = {
    items: TABS,
    active: activeTab,
    onChange: selectTab,
    label: "작업실 화면",
  };

  return { menu, tabs };
}
