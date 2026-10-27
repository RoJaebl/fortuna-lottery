// 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
import { useStore } from "supa-store/react";
import { LOW_MAX } from "@lib/lotto-rules";
import type { TabItem } from "@ui/Tabs";
import type { StatisticsModel } from "./_model/Statistics.model";
import { type DistBar, StatisticsViewModel } from "./_model/Statistics.viewmodel";
import type { HotColdBoardProps } from "./HotColdBoard";
import type { NumberFrequencyBarsProps } from "./NumberFrequencyBars";
import type { PatternBar, PatternDistributionProps } from "./PatternDistribution";
import type { RecentGridProps } from "./RecentGrid";
import type { SumDistributionChartProps } from "./SumDistributionChart";
import type { TopPairsListProps } from "./TopPairsList";

export type StatView =
  | "sum"
  | "pattern"
  | "hotcold"
  | "pairs"
  | "frequency"
  | "recent";

/** 6개를 동등하게 나열한다 — 요약/우선순위 압축 없음 (설계 문서 §4) */
const STAT_VIEWS: readonly TabItem<StatView>[] = [
  { key: "sum", label: "합계 분포" },
  { key: "pattern", label: "패턴 분포" },
  { key: "hotcold", label: "핫/콜드" },
  { key: "pairs", label: "상위 페어" },
  { key: "frequency", label: "빈도 바" },
  { key: "recent", label: "최근 그리드" },
];

/** 합계 축의 길이 — 상대는 쌓은 회차의 최소~최대, 절대는 6개 합계가 낼 수 있는 21~255 */
export type SumAxisMode = "relative" | "absolute";

const SUM_AXIS_MODES: readonly TabItem<SumAxisMode>[] = [
  { key: "relative", label: "상대 길이" },
  { key: "absolute", label: "절대 길이" },
];

/** 6개 번호 합계가 낼 수 있는 범위 — 1+2+…+6 ~ 40+41+…+45 */
const SUM_RANGE = { min: 21, max: 255 };

const HOT_COLD_TOP = 8;

/** 잔디밭이 한 번에 보이는 회차 수의 기본값 — 화면이 그리드 폭을 재면 그 칸 수로 바뀐다. 나머지는 타임라인으로 옮겨 본다 */
export const RECENT_WINDOW = 100;

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

/**
 * 잔디밭 창 — 전 회차 중 start 부터 size 회차. start 가 null 이면 최신 회차에 붙는다.
 * 범위를 벗어난 start 는 끝으로 당긴다.
 */
export function recentWindow<T extends { round: number }>(
  columns: T[],
  start: number | null,
  size = RECENT_WINDOW,
): { start: number; maxStart: number; columns: T[]; range: string } {
  const maxStart = Math.max(0, columns.length - size);
  const from = Math.min(Math.max(0, start ?? maxStart), maxStart);
  const shown = columns.slice(from, from + size);
  const first = shown[0]?.round;
  const last = shown[shown.length - 1]?.round;
  const range = first && last ? `제${first}회 ~ 제${last}회 (전 ${columns.length}회차 중 ${shown.length}회차)` : "";
  return { start: from, maxStart, columns: shown, range };
}

/** 재생 바에서 고른 회차(0 부터 센 위치)가 창의 맨 오른쪽에 오는 창의 시작 */
export function startEndingAt(index: number, total: number, size = RECENT_WINDOW): number {
  const maxStart = Math.max(0, total - size);
  return Math.min(Math.max(0, index - size + 1), maxStart);
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
  const {
    activeStatView,
    recentStart,
    recentSize,
    sumUntil,
    sumAxis,
    changeStatView,
    changeRecentStart,
    changeRecentSize,
    changeSumUntil,
    changeSumAxis,
  } = useStore("state.home.StatisticsPanel.view");

  const tabs = { items: STAT_VIEWS, active: activeStatView, onChange: changeStatView };

  if (!stats) return { loading, error, tabs, views: null };

  const total = stats.recentGrid.length;
  const roundAt = (index: number) => stats.recentGrid[index]?.round ?? 0;
  const rarity = myNumbers ? oddEvenRarity(myNumbers, stats) : null;

  // 합계 분포는 1회부터 재생 바가 고른 회차까지 쌓은 것이다 — 처음엔 최신 회차까지
  const until = Math.min(sumUntil ?? total - 1, total - 1);
  const sums = stats.sumsUntil(until, sumAxis === "absolute" ? SUM_RANGE : null);
  const my = myNumbers ? sumPosition(myNumbers, sums) : null;
  const upTo = `제${roundAt(0)}회 ~ 제${roundAt(until)}회 누적`;
  const sum: SumDistributionChartProps = {
    chart: sums.sumChart,
    subtitle: my
      ? `${upTo} · 내 조합 합계 ${my.mySum} — 그 회차들의 ${my.percentBelow}%가 이보다 작았습니다`
      : `${upTo} · 6개 번호 합계의 분포 (${sums.totalDraws}회차)`,
    marker: my ? { sum: my.mySum, x: sums.sumRatio(my.mySum) } : null,
    axis: { items: SUM_AXIS_MODES, active: sumAxis, onChange: changeSumAxis },
    // 내 합계가 든 구간을 표에 표시한다 — 내 조합이 없으면 표시 없음
    bands: sums.sumBands.map((band, i) => ({ ...band, mine: my !== null && Math.floor((my.mySum - 21) / 20) === i })),
    timeline:
      total > 1
        ? {
            position: until,
            total,
            roundAt,
            onSeek: changeSumUntil,
            page: 100,
            label: "합계 분포를 쌓을 마지막 회차",
            valueText: `제${roundAt(until)}회까지`,
          }
        : null,
  };
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
  // 칸은 창 안의 회차만 짓는다 — 전 회차를 다 지으면 타임라인을 끌 때마다 5만 칸을 새로 만든다
  const grid = recentWindow(stats.recentGrid, recentStart, recentSize);
  const recent: RecentGridProps = {
    range: grid.range,
    columns: grid.columns.map(StatisticsViewModel.gridColumn),
    onFit: (size) => {
      if (size !== recentSize) changeRecentSize(size);
    },
    // 재생 위치는 창의 마지막 회차다. 고른 회차가 창의 맨 오른쪽에 오도록 창을 옮긴다
    timeline:
      grid.maxStart > 0
        ? {
            position: grid.start + grid.columns.length - 1,
            total,
            roundAt,
            onSeek: (index) => changeRecentStart(startEndingAt(index, total, recentSize)),
            page: grid.columns.length,
            label: "잔디밭 회차 창",
            valueText: grid.range,
          }
        : null,
  };

  return { loading, error, tabs, views: { sum, pattern, hotcold, pairs, frequency, recent } };
}
