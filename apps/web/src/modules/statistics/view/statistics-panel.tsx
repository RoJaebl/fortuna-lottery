"use client";
import { useState } from "react";
import { Tabs, type TabItem } from "@/shared/ui/tabs";
import { useStatisticsViewModel } from "../viewmodel/use-statistics.viewmodel";
import { FrequencyHeatmap } from "./frequency-heatmap";
import { HotColdBoard } from "./hot-cold-board";
import { NumberFrequencyBars } from "./number-frequency-bars";
import { PatternDistribution } from "./pattern-distribution";
import { ProbabilityReality } from "./probability-reality";
import { RecentGrid } from "./recent-grid";
import { SumDistributionChart } from "./sum-distribution-chart";
import { TopPairsList } from "./top-pairs-list";

type StatView =
  | "probability"
  | "sum"
  | "heatmap"
  | "pattern"
  | "hotcold"
  | "pairs"
  | "frequency"
  | "recent";

/** 8개를 동등하게 나열한다 — 요약/우선순위 압축 없음 (설계 문서 §4) */
const STAT_VIEWS: readonly TabItem<StatView>[] = [
  { key: "probability", label: "확률 현실" },
  { key: "sum", label: "합계 분포" },
  { key: "heatmap", label: "히트맵" },
  { key: "pattern", label: "패턴 분포" },
  { key: "hotcold", label: "핫/콜드" },
  { key: "pairs", label: "상위 페어" },
  { key: "frequency", label: "빈도 바" },
  { key: "recent", label: "최근 그리드" },
];

interface StatisticsPanelProps {
  /** 현재 조합 — 분포 위 내 위치 마커에 사용 */
  myNumbers: number[] | null;
}

export function StatisticsPanel({ myNumbers }: StatisticsPanelProps) {
  const { stats, error } = useStatisticsViewModel();
  const [activeStatView, setActiveStatView] = useState<StatView>("probability");

  if (error) return <p className="text-sm text-red-600">통계를 불러오지 못했습니다: {error}</p>;
  if (!stats) return <p className="text-sm text-slate-500">통계 계산 중…</p>;

  function renderActiveView() {
    switch (activeStatView) {
      case "probability":
        return <ProbabilityReality stats={stats!} />;
      case "sum":
        return <SumDistributionChart stats={stats!} myNumbers={myNumbers} />;
      case "heatmap":
        return <FrequencyHeatmap stats={stats!} />;
      case "pattern":
        return <PatternDistribution stats={stats!} myNumbers={myNumbers} />;
      case "hotcold":
        return <HotColdBoard stats={stats!} />;
      case "pairs":
        return <TopPairsList stats={stats!} />;
      case "frequency":
        return <NumberFrequencyBars stats={stats!} />;
      case "recent":
        return <RecentGrid stats={stats!} />;
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        items={STAT_VIEWS}
        active={activeStatView}
        onChange={setActiveStatView}
        variant="chip"
        label="통계 항목"
      />
      <div role="tabpanel">{renderActiveView()}</div>
    </div>
  );
}
