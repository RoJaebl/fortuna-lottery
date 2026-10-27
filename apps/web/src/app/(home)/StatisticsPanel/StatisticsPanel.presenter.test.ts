import { beforeEach, describe, expect, it } from "vitest";
import { getStore, overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { StatisticsModel } from "./_model/Statistics.model";
import { StatisticsViewModel } from "./_model/Statistics.viewmodel";
import { act, renderHook } from "@testing-library/react";
import { oddEvenRarity, RECENT_WINDOW, recentWindow, startEndingAt, sumPosition, useStatisticsPanelPresenter } from "./StatisticsPanel.presenter";

/** 통계 응답은 오지 않는다 — 받은 통계는 withStats 가 칸에 넣는다 */
beforeEach(() => {
  const http = new TestHttpClient();
  http.respond("/api/statistics", () => new Promise(() => {}));
  overrideStore("infra.http", () => ({ client: http }));
});

/** 조합을 정한다 — 시험 하나 안에서도 부를 때마다 그 값으로 바꾼다 */
function withState(numbers: number[] | null = null) {
  getStore("state.home.combination").setState({ numbers });
}

const stats = (over: Partial<StatisticsModel> = {}): StatisticsModel =>
  Object.assign(new StatisticsModel(), {
    totalDraws: 100,
    latestRound: 100,
    frequency: [],
    sumDistribution: [],
    oddCountDist: [0, 0, 10, 30, 40, 15, 5],
    lowCountDist: [],
    zoneCounts: [],
    hotCold: [],
    topPairs: [],
    recentGrid: [],
    totalCombinations: 8_145_060,
    ...over,
  });

describe("statistics presenters (순수 함수)", () => {
  it("oddEvenRarity — 내 홀짝 패턴의 과거 출현 비율", () => {
    const r = oddEvenRarity([1, 3, 5, 7, 2, 4], stats()); // 홀 4
    expect(r.label).toBe("홀 4 : 짝 2");
    expect(r.percent).toBe(40);
  });

  it("sumPosition — 내 합계보다 작은 과거 회차 비율", () => {
    const s = stats({
      sumDistribution: [
        { sum: 100, count: 30 },
        { sum: 120, count: 40 },
        { sum: 140, count: 30 },
      ],
    });
    expect(sumPosition([20, 30, 10, 25, 15, 20], s)).toEqual({ mySum: 120, percentBelow: 30 });
  });

  it("recentWindow — 처음엔 최신 100회차, start 는 0~끝 사이로 당긴다", () => {
    const rounds = Array.from({ length: 250 }, (_, i) => ({ round: i + 1 }));
    const latest = recentWindow(rounds, null);
    expect(latest.columns).toHaveLength(RECENT_WINDOW);
    expect(latest.start).toBe(150);
    expect(latest.maxStart).toBe(150);
    expect(latest.range).toBe("제151회 ~ 제250회 (전 250회차 중 100회차)");
    expect(recentWindow(rounds, 0).columns[0]?.round).toBe(1);
    expect(recentWindow(rounds, -5).start).toBe(0);
    expect(recentWindow(rounds, 999).start).toBe(150);
    expect(recentWindow(rounds.slice(0, 3), null)).toMatchObject({ start: 0, maxStart: 0 });
    expect(recentWindow([], null).range).toBe("");
    expect(recentWindow(rounds, null, 40)).toMatchObject({ start: 210, maxStart: 210 });
  });

  it("startEndingAt — 고른 회차가 창의 맨 오른쪽에 오도록 창의 시작을 정한다", () => {
    expect(startEndingAt(199, 250)).toBe(100); // 100~199 번째
    expect(startEndingAt(249, 250)).toBe(150); // 최신
    expect(startEndingAt(10, 250)).toBe(0); // 앞에 100개가 없으면 처음부터
    expect(startEndingAt(2, 3)).toBe(0); // 전 회차가 창보다 적다
    expect(startEndingAt(199, 250, 40)).toBe(160); // 창이 40칸이면 160~199 번째
  });
});

describe("useStatisticsPanelPresenter", () => {
  it("불러오는 중이면 loading 이 참", () => {
    withState();
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    expect(result.current.loading).toBe(true);
    expect(result.current.views).toBeNull();
  });

  /** 받은 통계를 칸에 넣는다. loading 이면 다시 받기를 걸어 둔다 — 응답은 오지 않는다 */
  const withStats = (over: Partial<StatisticsModel> = {}, loading = false) => {
    const resource = getStore("api.home.StatisticsPanel.statistics").getState();
    resource.setData(StatisticsViewModel.from(stats(over)));
    if (loading) void resource.invalidate();
  };

  it("다시 받는 중에도 앞선 통계가 있으면 views 를 낸다", () => {
    withStats({}, true);
    withState();
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    expect(result.current.views).not.toBeNull();
  });

  it("hotcold — 상위 개수 상수와 gap 라벨(0이면 최신)", () => {
    withStats({
      hotCold: [
        { number: 1, count: 5, gap: 0 },
        { number: 2, count: 5, gap: 3 },
        { number: 3, count: 5, gap: 12 },
      ],
    });
    withState();
    const hotcold = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.hotcold;
    expect(hotcold?.top).toBe(8);
    expect(hotcold?.coldest).toEqual([
      { number: 3, gapLabel: "12회" },
      { number: 2, gapLabel: "3회" },
      { number: 1, gapLabel: "0회" },
    ]);
    expect(hotcold?.hottest).toEqual([
      { number: 1, gapLabel: "최신" },
      { number: 2, gapLabel: "3회" },
      { number: 3, gapLabel: "12회" },
    ]);
  });

  it("pairs — TOP 15 문구의 상수와 막대", () => {
    withStats({ topPairs: [{ a: 1, b: 2, count: 4 }] });
    withState();
    const pairs = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.pairs;
    expect(pairs).toEqual({ top: 15, bars: [{ pair: [1, 2], count: 4, widthPercent: 100 }] });
  });

  it("pattern — 내 조합이 있으면 희귀도 문구와 강조 막대", () => {
    withStats({ lowCountDist: [0, 0, 0, 0, 0, 0, 7], zoneCounts: [1, 1, 1, 1, 1] });
    withState([1, 3, 5, 7, 2, 4]);
    const pattern = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.pattern;
    expect(pattern?.subtitle).toBe("내 조합(홀 4 : 짝 2)과 같은 홀짝 패턴은 과거 회차의 40%였습니다");
    expect(pattern?.oddBars.map((b) => b.highlighted)).toEqual([false, false, false, false, true, false, false]);
    expect(pattern?.lowBars.map((b) => b.highlighted)).toEqual([false, false, false, false, false, false, true]);
    expect(pattern?.zoneBars.every((b) => !b.highlighted)).toBe(true);
    expect(pattern?.oddBars[4]).toMatchObject({ label: "홀4", percent: 40, heightPx: 62 });
  });

  it("pattern — 저구간 경계는 22 (22 는 저구간, 23 은 아님)", () => {
    withStats({ lowCountDist: [0, 0, 5, 0, 0, 0, 0] });
    withState([1, 22, 23, 30, 40, 45]);
    const pattern = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.pattern;
    expect(pattern?.lowBars.map((b) => b.highlighted)).toEqual([false, false, true, false, false, false, false]);
    expect(pattern?.oddBars.map((b) => b.highlighted)).toEqual([false, false, false, true, false, false, false]);
  });

  it("pattern — 내 조합이 없으면 안내 문구, 강조 없음", () => {
    withStats();
    withState();
    const pattern = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.pattern;
    expect(pattern?.subtitle).toBe("내 조합이 과거 패턴과 얼마나 닮았는지 확인하세요");
    expect(pattern?.oddBars.some((b) => b.highlighted)).toBe(false);
  });

  // 합계 100 이 3회, 120 이 4회, 140 이 3회 — 회차 1~10
  const sumRounds = [100, 100, 100, 120, 120, 120, 120, 140, 140, 140].map((sum, i) => ({
    round: i + 1,
    numbers: [sum - 15, 3, 3, 3, 3, 3],
  }));
  const sumDistribution = [
    { sum: 100, count: 3 },
    { sum: 120, count: 4 },
    { sum: 140, count: 3 },
  ];

  it("sum — 내 합계 문구와 표지 위치(0~1)", () => {
    withStats({ sumDistribution, recentGrid: sumRounds });
    withState([20, 30, 10, 25, 15, 20]);
    const mine = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.sum;
    expect(mine?.subtitle).toBe("제1회 ~ 제10회 누적 · 내 조합 합계 120 — 그 회차들의 30%가 이보다 작았습니다");
    expect(mine?.marker).toEqual({ sum: 120, x: 0.5 });
    expect(mine?.chart?.maxCount).toBe(4);
    // 합계 120 은 101~120 구간(다섯째)이다
    expect(mine?.bands.findIndex((b) => b.mine)).toBe(4);
    expect(mine?.bands[4]?.label).toBe("101~120");

    withState();
    const none = renderHook(() => useStatisticsPanelPresenter()).result.current.views?.sum;
    expect(none?.subtitle).toBe("제1회 ~ 제10회 누적 · 6개 번호 합계의 분포 (10회차)");
    expect(none?.marker).toBeNull();
    expect(none?.bands.some((b) => b.mine)).toBe(false);
  });

  it("sum — 상대 길이는 쌓은 회차의 양 끝을 넉넉히 잡은 축이고, 절대 길이는 21~255 가 축이다", () => {
    withStats({ sumDistribution, recentGrid: sumRounds });
    withState([20, 30, 10, 25, 15, 20]);
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    act(() => result.current.views?.sum.timeline?.onSeek(4)); // 제5회까지 — 합계 100~120, 축은 80~140
    expect(result.current.views?.sum.axis.active).toBe("relative");
    expect(result.current.views?.sum.chart).toMatchObject({ minSum: 80, maxSum: 140 });
    expect(result.current.views?.sum.marker?.x).toBeCloseTo(40 / 60);

    act(() => result.current.views?.sum.axis.onChange("absolute"));
    expect(result.current.views?.sum.chart).toMatchObject({ minSum: 21, maxSum: 255 });
    expect(result.current.views?.sum.marker?.x).toBeCloseTo((120 - 21) / 234);
  });

  it("sum — 재생 바로 고른 회차까지만 쌓는다", () => {
    withStats({ sumDistribution, recentGrid: sumRounds });
    withState([20, 30, 10, 25, 15, 20]);
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    expect(result.current.views?.sum.timeline?.position).toBe(9);
    expect(result.current.views?.sum.timeline?.minPosition).toBe(0);
    // 배속은 잔디밭과 함께 쓴다
    expect(result.current.views?.sum.timeline?.speed).toBe(1);
    act(() => result.current.views?.sum.timeline?.onSpeedChange(5));
    expect(result.current.views?.sum.timeline?.speed).toBe(5);
    act(() => result.current.views?.sum.timeline?.onSeek(4)); // 제5회까지 — 100 이 3회, 120 이 2회
    const sum = result.current.views?.sum;
    expect(sum?.timeline?.position).toBe(4);
    expect(sum?.subtitle).toBe("제1회 ~ 제5회 누적 · 내 조합 합계 120 — 그 회차들의 60%가 이보다 작았습니다");
    expect(sum?.bands[4]).toMatchObject({ count: 2, percent: 40 });
  });

  it("frequency · recent — 표시 모델의 파생값을 그대로 넘긴다", () => {
    withStats({ frequency: [1, 2], recentGrid: [{ round: 3, numbers: [1] }] });
    withState();
    const views = renderHook(() => useStatisticsPanelPresenter()).result.current.views;
    expect(views?.frequency.bars).toHaveLength(2);
    expect(views?.recent.range).toBe("제3회 ~ 제3회 (전 1회차 중 1회차)");
    expect(views?.recent.columns[0]?.cells).toHaveLength(45);
  });

  it("recent — 타임라인으로 창을 옮기면 그 회차의 칸만 짓는다", () => {
    const recentGrid = Array.from({ length: 150 }, (_, i) => ({ round: i + 1, numbers: [1] }));
    withStats({ recentGrid });
    withState();
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    expect(result.current.views?.recent.columns[0]?.round).toBe(51);
    act(() => result.current.views?.recent.timeline?.onSeek(0));
    expect(result.current.views?.recent.columns[0]?.round).toBe(1);
    expect(result.current.views?.recent.columns).toHaveLength(RECENT_WINDOW);
  });

  it("recent — 그리드에 들어가는 칸 수를 알리면 그만큼만 보이고 최신 회차에 붙는다", () => {
    const recentGrid = Array.from({ length: 150 }, (_, i) => ({ round: i + 1, numbers: [1] }));
    withStats({ recentGrid });
    withState();
    const { result } = renderHook(() => useStatisticsPanelPresenter());
    act(() => result.current.views?.recent.onFit(60));
    expect(result.current.views?.recent.columns).toHaveLength(60);
    expect(result.current.views?.recent.columns[0]?.round).toBe(91);
    // 창 양옆 버퍼 — 최신 창이면 앞은 이웃 회차 넷, 뒤는 회차가 없어 비어 있다
    expect(result.current.views?.recent.before.map((c) => c?.round ?? null)).toEqual([87, 88, 89, 90]);
    expect(result.current.views?.recent.after).toEqual([null, null, null, null]);
    // 재생을 처음부터 다시 돌릴 자리는 창이 처음 회차에 붙을 때의 끝이다
    expect(result.current.views?.recent.timeline?.minPosition).toBe(59);
    // 고른 회차가 맨 오른쪽에 오는 창도 그 칸 수로 센다
    act(() => result.current.views?.recent.timeline?.onSeek(99));
    expect(result.current.views?.recent.columns[0]?.round).toBe(41);
    expect(result.current.views?.recent.after.map((c) => c?.round)).toEqual([101, 102, 103, 104]);
  });
});
