import { useState, type ComponentProps } from "react";
import type { GeneratorCard } from "@/modules/generator";
import type { LotterietusCard } from "@/modules/lotterietus";
import type { PicksCard } from "@/modules/picks";
import type { SimulationCard } from "@/modules/simulation";
import type { StatisticsPanel } from "@/modules/statistics";
import type { TabItem, Tabs } from "@/shared/ui/tabs";

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

  const lotterietus: ComponentProps<typeof LotterietusCard> = {
    generatorOpen: isGeneratorOpen,
    onToggleGenerator: () => setIsGeneratorOpen((open) => !open),
  };
  const generator: ComponentProps<typeof GeneratorCard> = { onGenerated: setCurrentNumbers };
  const tabs: ComponentProps<typeof Tabs<HomeTabKey>> = {
    items: TABS,
    active: activeTab,
    onChange: setActiveTab,
    label: "주요 화면",
  };
  const statistics: ComponentProps<typeof StatisticsPanel> = { myNumbers: currentNumbers };
  const simulation: ComponentProps<typeof SimulationCard> = { numbers: currentNumbers };
  const picks: ComponentProps<typeof PicksCard> = { currentNumbers };

  return { isGeneratorOpen, lotterietus, generator, tabs, statistics, simulation, picks };
}
