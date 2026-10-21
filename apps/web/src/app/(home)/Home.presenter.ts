import { useState } from "react";
import { useSharedState } from "@fortuna-lottery/store/react";
import type { TabItem, TabsProps } from "@ui/tabs";

export type HomeTabKey = "statistics" | "simulation" | "picks" | "results" | "hypothesis";

/** 각 카드의 기존 title을 탭 라벨로 그대로 사용 (설계 문서 §3) */
const TABS: readonly TabItem<HomeTabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "picks", label: "내 번호" },
  { key: "results", label: "결과 확인" },
  { key: "hypothesis", label: "가정 실험실" },
];

/**
 * 페이지의 presenter — 활성 탭은 이 화면 안의 지역 상태다. 자식이 함께 쓰는 현재 조합·생성기 열림은
 * _state/ 의 공통 상태이고, 이 presenter 는 생성기를 펼칠지만 읽는다 (frontend-shared-state §1)
 */
export function useHomePresenter() {
  const isGeneratorOpen = useSharedState("state.home.generatorOpen", (s) => s.open);
  const [activeTab, setActiveTab] = useState<HomeTabKey>("statistics");

  const tabs: TabsProps<HomeTabKey> = {
    items: TABS,
    active: activeTab,
    onChange: setActiveTab,
    label: "주요 화면",
  };

  return { isGeneratorOpen, tabs };
}
