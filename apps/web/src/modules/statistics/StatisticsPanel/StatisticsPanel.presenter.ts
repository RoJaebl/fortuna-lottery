// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { useState } from "react";
import type { TabItem } from "@/shared/ui/tabs";
import type { StatisticsModel } from "../model/Statistics.model";
import { useGetStatisticsAction } from "./action/getStatistics.action";
import type { FrequencyHeatmapProps } from "./FrequencyHeatmap";
import type { HotColdBoardProps } from "./HotColdBoard";
import { lowCountOf, oddCountOf, sumOf } from "./model/Combination.model";
import type { NumberFrequencyBarsProps } from "./NumberFrequencyBars";
import type { PatternDistributionProps } from "./PatternDistribution";
import type { ProbabilityRealityProps } from "./ProbabilityReality";
import type { RecentGridProps } from "./RecentGrid";
import type { SumDistributionChartProps } from "./SumDistributionChart";
import type { TopPairsListProps } from "./TopPairsList";

export type StatView =
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

const HOT_COLD_TOP = 8;

/**
 * 패턴 희귀도 배지 — 내 조합의 홀짝 패턴이 과거 회차에서 차지한 비율 (사실 기반).
 * "희귀함"은 좋고 나쁨이 아니라 출현 빈도의 서술일 뿐이다.
 * 내 조합이라는 바깥 값을 보므로 표시 모델이 아니라 조정자에 둔다.
 */
export function oddEvenRarity(
  myNumbers: number[],
  stats: StatisticsModel,
): { label: string; percent: number } {
  const odd = oddCountOf(myNumbers);
  const count = stats.oddCountDist[odd] ?? 0;
  const percent = stats.totalDraws > 0 ? (count / stats.totalDraws) * 100 : 0;
  return {
    label: `홀 ${odd} : 짝 ${6 - odd}`,
    percent: Math.round(percent * 10) / 10,
  };
}

/** 합계 분포에서 내 합계가 속한 위치 서술 (과거 회차 대비) */
export function sumPosition(
  myNumbers: number[],
  stats: StatisticsModel,
): { mySum: number; percentBelow: number } {
  const mySum = sumOf(myNumbers);
  let below = 0;
  let total = 0;
  for (const { sum, count } of stats.sumDistribution) {
    total += count;
    if (sum < mySum) below += count;
  }
  return {
    mySum,
    percentBelow: total > 0 ? Math.round((below / total) * 1000) / 10 : 0,
  };
}

/** 핫/콜드 정렬 — gap 큰 순(콜드) / 작은 순(핫) 상위 n. 몇 개를 볼지라는 바깥 값을 보므로 조정자에 둔다 */
export function coldest(stats: StatisticsModel, n: number): StatisticsModel["hotCold"] {
  return [...stats.hotCold].sort((a, b) => b.gap - a.gap || a.number - b.number).slice(0, n);
}

export function hottest(stats: StatisticsModel, n: number): StatisticsModel["hotCold"] {
  return [...stats.hotCold].sort((a, b) => a.gap - b.gap || a.number - b.number).slice(0, n);
}

export function useStatisticsPanelPresenter(myNumbers: number[] | null) {
  const { stats, error } = useGetStatisticsAction();
  const [activeStatView, setActiveStatView] = useState<StatView>("probability");

  const tabs = { items: STAT_VIEWS, active: activeStatView, onChange: setActiveStatView };

  if (!stats) return { error, tabs, views: null };

  const probability: ProbabilityRealityProps = { stats };
  const sum: SumDistributionChartProps = { stats, my: myNumbers ? sumPosition(myNumbers, stats) : null };
  const heatmap: FrequencyHeatmapProps = { stats };
  const pattern: PatternDistributionProps = {
    stats,
    rarity: myNumbers ? oddEvenRarity(myNumbers, stats) : null,
    oddHighlight: myNumbers ? oddCountOf(myNumbers) : null,
    lowHighlight: myNumbers ? lowCountOf(myNumbers) : null,
  };
  const hotcold: HotColdBoardProps = {
    coldest: coldest(stats, HOT_COLD_TOP),
    hottest: hottest(stats, HOT_COLD_TOP),
  };
  const pairs: TopPairsListProps = { stats };
  const frequency: NumberFrequencyBarsProps = { stats };
  const recent: RecentGridProps = { stats };

  return { error, tabs, views: { probability, sum, heatmap, pattern, hotcold, pairs, frequency, recent } };
}
