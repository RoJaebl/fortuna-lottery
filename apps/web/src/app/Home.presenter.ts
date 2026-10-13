import { useState } from "react";
import type { GeneratorCardProps } from "@/modules/generator";
import type { LotterietusCardProps } from "@/modules/lotterietus";
import type { PicksCardProps } from "@/modules/picks";
import type { SimulationCardProps } from "@/modules/simulation";
import type { StatisticsPanelProps } from "@/modules/statistics";
import type { TabItem, TabsProps } from "@/shared/ui/tabs";

export type HomeTabKey = "statistics" | "simulation" | "picks" | "results";

/** 각 카드의 기존 title을 탭 라벨로 그대로 사용 (설계 문서 §3) */
const TABS: readonly TabItem<HomeTabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "picks", label: "내 번호" },
  { key: "results", label: "결과 확인" },
];

/** 셸의 조정자 — 모듈 간 공유 상태(현재 조합)와 화면 전환 상태만 쥔다 (frontend-module-layout §1) */
export function useHomePresenter() {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTabKey>("statistics");

  const lotterietus: LotterietusCardProps = {
    generatorOpen: isGeneratorOpen,
    onToggleGenerator: () => setIsGeneratorOpen((open) => !open),
  };
  const generator: GeneratorCardProps = { onGenerated: setCurrentNumbers };
  const tabs: TabsProps<HomeTabKey> = {
    items: TABS,
    active: activeTab,
    onChange: setActiveTab,
    label: "주요 화면",
  };
  const statistics: StatisticsPanelProps = { myNumbers: currentNumbers };
  const simulation: SimulationCardProps = { numbers: currentNumbers };
  const picks: PicksCardProps = { currentNumbers };

  return { isGeneratorOpen, lotterietus, generator, tabs, statistics, simulation, picks };
}
