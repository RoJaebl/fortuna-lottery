// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { useState } from "react";
import { useStore } from "@fortuna-lottery/store/react";
import { LOW_MAX } from "@lib/lotto-rules";
import type { TabItem } from "@ui/Tabs";
import type { StatisticsModel } from "./_model/Statistics.model";
import type { DistBar } from "./_model/Statistics.viewmodel";
import type { FrequencyHeatmapProps } from "./FrequencyHeatmap";
import type { HotColdBoardProps } from "./HotColdBoard";
import type { NumberFrequencyBarsProps } from "./NumberFrequencyBars";
import type { PatternBar, PatternDistributionProps } from "./PatternDistribution";
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

/** 서버가 내는 상위 페어 개수(GetStatistics 의 TOP_PAIRS) — 카드 제목 「TOP 15」 */
const TOP_PAIRS = 15;

/** 조합 합계 */
function sumOf(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/** 홀수 개수 */
function oddCountOf(numbers: number[]): number {
  return numbers.filter((n) => n % 2 === 1).length;
}

/** 저구간(1~22) 개수 */
function lowCountOf(numbers: number[]): number {
  return numbers.filter((n) => n <= LOW_MAX).length;
}

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

/** gap 표기 — 최근 나온 쪽은 0을 「최신」으로 쓴다 */
function gapItems(
  items: StatisticsModel["hotCold"],
  latestLabel: boolean,
): HotColdBoardProps["coldest"] {
  return items.map(({ number, gap }) => ({ number, gapLabel: latestLabel && gap === 0 ? "최신" : `${gap}회` }));
}

/** 내 조합이 놓인 막대를 표시한다 — 내 조합이 없으면 강조 없음 */
function highlightBars(bars: DistBar[], highlight: number | null): PatternBar[] {
  return bars.map((bar, i) => ({ ...bar, highlighted: i === highlight }));
}

export function useStatisticsPanelPresenter() {
  const { numbers: myNumbers } = useStore("state.home.combination", { pick: ["numbers"] }); // 분포 위 내 위치 마커에 쓴다
  const { data: stats, status, error } = useStore("api.home.StatisticsPanel.statistics");
  // 처음 그릴 때(idle)도 아직 받기 전이다
  const loading = status === "idle" || status === "loading";
  const [activeStatView, setActiveStatView] = useState<StatView>("probability");

  const tabs = { items: STAT_VIEWS, active: activeStatView, onChange: setActiveStatView };

  if (!stats) return { loading, error, tabs, views: null };

  const my = myNumbers ? sumPosition(myNumbers, stats) : null;
  const rarity = myNumbers ? oddEvenRarity(myNumbers, stats) : null;

  const probability: ProbabilityRealityProps = { stats };
  const sum: SumDistributionChartProps = {
    chart: stats.sumChart,
    subtitle: my
      ? `내 조합 합계 ${my.mySum} — 과거 회차의 ${my.percentBelow}%가 이보다 작았습니다`
      : "전 회차 6개 번호 합계의 분포",
    marker: my ? { sum: my.mySum, x: stats.sumRatio(my.mySum) } : null,
  };
  const heatmap: FrequencyHeatmapProps = { stats };
  const pattern: PatternDistributionProps = {
    subtitle: rarity
      ? `내 조합(${rarity.label})과 같은 홀짝 패턴은 과거 회차의 ${rarity.percent}%였습니다`
      : "내 조합이 과거 패턴과 얼마나 닮았는지 확인하세요",
    oddBars: highlightBars(stats.oddBars, myNumbers ? oddCountOf(myNumbers) : null),
    lowBars: highlightBars(stats.lowBars, myNumbers ? lowCountOf(myNumbers) : null),
    zoneBars: highlightBars(stats.zoneBars, null),
  };
  const hotcold: HotColdBoardProps = {
    top: HOT_COLD_TOP,
    coldest: gapItems(coldest(stats, HOT_COLD_TOP), false),
    hottest: gapItems(hottest(stats, HOT_COLD_TOP), true),
  };
  const pairs: TopPairsListProps = { top: TOP_PAIRS, bars: stats.topPairBars };
  const frequency: NumberFrequencyBarsProps = { bars: stats.frequencyBars };
  const recent: RecentGridProps = { range: stats.recentRange, columns: stats.recentColumns };

  return { loading, error, tabs, views: { probability, sum, heatmap, pattern, hotcold, pairs, frequency, recent } };
}
