"use client";
import { useStatisticsViewModel } from "../viewmodel/use-statistics.viewmodel";
import { FrequencyHeatmap } from "./frequency-heatmap";
import { HotColdBoard } from "./hot-cold-board";
import { NumberFrequencyBars } from "./number-frequency-bars";
import { PatternDistribution } from "./pattern-distribution";
import { ProbabilityReality } from "./probability-reality";
import { RecentGrid } from "./recent-grid";
import { SumDistributionChart } from "./sum-distribution-chart";
import { TopPairsList } from "./top-pairs-list";

interface StatisticsPanelProps {
  /** 현재 조합 — 분포 위 내 위치 마커에 사용 */
  myNumbers: number[] | null;
}

export function StatisticsPanel({ myNumbers }: StatisticsPanelProps) {
  const { stats, error } = useStatisticsViewModel();

  if (error) return <p className="text-sm text-red-400">통계를 불러오지 못했습니다: {error}</p>;
  if (!stats) return <p className="text-sm text-slate-500">통계 계산 중…</p>;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ProbabilityReality stats={stats} />
      <SumDistributionChart stats={stats} myNumbers={myNumbers} />
      <FrequencyHeatmap stats={stats} />
      <PatternDistribution stats={stats} myNumbers={myNumbers} />
      <HotColdBoard stats={stats} />
      <TopPairsList stats={stats} />
      <NumberFrequencyBars stats={stats} />
      <RecentGrid stats={stats} />
    </div>
  );
}
