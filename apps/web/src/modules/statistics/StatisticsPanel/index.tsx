"use client";
import { Tabs } from "@/shared/ui/tabs";
import { FrequencyHeatmap } from "./FrequencyHeatmap";
import { HotColdBoard } from "./HotColdBoard";
import { NumberFrequencyBars } from "./NumberFrequencyBars";
import { PatternDistribution } from "./PatternDistribution";
import { ProbabilityReality } from "./ProbabilityReality";
import { RecentGrid } from "./RecentGrid";
import { type StatView, useStatisticsPanelPresenter } from "./StatisticsPanel.presenter";
import { SumDistributionChart } from "./SumDistributionChart";
import { TopPairsList } from "./TopPairsList";

type Views = NonNullable<ReturnType<typeof useStatisticsPanelPresenter>["views"]>;

function renderActiveView(active: StatView, views: Views) {
  switch (active) {
    case "probability":
      return <ProbabilityReality {...views.probability} />;
    case "sum":
      return <SumDistributionChart {...views.sum} />;
    case "heatmap":
      return <FrequencyHeatmap {...views.heatmap} />;
    case "pattern":
      return <PatternDistribution {...views.pattern} />;
    case "hotcold":
      return <HotColdBoard {...views.hotcold} />;
    case "pairs":
      return <TopPairsList {...views.pairs} />;
    case "frequency":
      return <NumberFrequencyBars {...views.frequency} />;
    case "recent":
      return <RecentGrid {...views.recent} />;
    default: {
      const exhaustiveCheck: never = active;
      return exhaustiveCheck;
    }
  }
}

interface StatisticsPanelProps {
  /** 현재 조합 — 분포 위 내 위치 마커에 사용 */
  myNumbers: number[] | null;
}

export function StatisticsPanel({ myNumbers }: StatisticsPanelProps) {
  const { error, tabs, views } = useStatisticsPanelPresenter(myNumbers);

  if (error) return <p className="text-sm text-red-600">통계를 불러오지 못했습니다: {error}</p>;
  if (!views) return <p className="text-sm text-slate-500">통계 계산 중…</p>;

  return (
    <div className="space-y-4">
      <Tabs {...tabs} variant="chip" label="통계 항목" />
      <div role="tabpanel">{renderActiveView(tabs.active, views)}</div>
    </div>
  );
}
