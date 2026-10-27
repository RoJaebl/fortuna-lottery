import { describe, expect, it } from "vitest";
import { StatisticsModel } from "./Statistics.model";
import { StatisticsViewModel } from "./Statistics.viewmodel";

const stats = (over: Partial<StatisticsModel> = {}): StatisticsViewModel =>
  StatisticsViewModel.from(
    Object.assign(new StatisticsModel(), {
      totalDraws: 100,
      latestRound: 100,
      frequency: [],
      sumDistribution: [],
      oddCountDist: [],
      lowCountDist: [],
      zoneCounts: [],
      hotCold: [],
      topPairs: [],
      recentGrid: [],
      totalCombinations: 8_145_060,
      ...over,
    }),
  );

describe("StatisticsViewModel (그 통계 하나로 정해지는 값)", () => {
  // 아래 기대값은 옮기기 전 화면의 식(NumberFrequencyBars·SumDistributionChart·TopPairsList·RecentGrid·
  // PatternDistribution)을 고정 입력에 그대로 적용해 얻은 값이다.
  it("frequencyBars — 최다 대비 높이와 전체 뽑힘 대비 비율(소수 둘째 자리)", () => {
    expect(stats({ frequency: [3, 0, 5, 2], totalDraws: 10 }).frequencyBars).toEqual([
      { number: 1, count: 3, heightPercent: 60, sharePercent: "5.00" },
      { number: 2, count: 0, heightPercent: 0, sharePercent: "0.00" },
      { number: 3, count: 5, heightPercent: 100, sharePercent: "8.33" },
      { number: 4, count: 2, heightPercent: 40, sharePercent: "3.33" },
    ]);
  });

  it("frequencyBars — 회차가 없으면 비율은 0, 모두 0이면 높이도 0", () => {
    expect(stats({ frequency: [0, 0], totalDraws: 0 }).frequencyBars).toEqual([
      { number: 1, count: 0, heightPercent: 0, sharePercent: "0" },
      { number: 2, count: 0, heightPercent: 0, sharePercent: "0" },
    ]);
  });

  it("sumChart — 합계 범위와 최다 건수, 점마다 0~1 비율 좌표", () => {
    const vm = stats({
      sumDistribution: [
        { sum: 100, count: 2 },
        { sum: 120, count: 4 },
        { sum: 140, count: 1 },
      ],
    });
    expect(vm.sumChart).toMatchObject({
      minSum: 100,
      maxSum: 140,
      maxCount: 4,
      points: [
        { sum: 100, count: 2, x: 0, y: 0.5 },
        { sum: 120, count: 4, x: 0.5, y: 1 },
        { sum: 140, count: 1, x: 1, y: 0.25 },
      ],
    });
    expect(vm.sumRatio(110)).toBe(0.25);
  });

  it("sumBands — 합계를 20 단위 구간(21~40 … 241~255)으로 묶어 회차 수와 회차 대비 비율(소수 첫째 자리)", () => {
    const bands = stats({
      totalDraws: 8,
      sumDistribution: [
        { sum: 21, count: 1 },
        { sum: 40, count: 1 },
        { sum: 41, count: 2 },
        { sum: 255, count: 4 },
      ],
    }).sumBands;
    expect(bands).toHaveLength(12);
    expect(bands[0]).toEqual({ label: "21~40", count: 2, percent: 25 });
    expect(bands[1]).toEqual({ label: "41~60", count: 2, percent: 25 });
    expect(bands[2]).toEqual({ label: "61~80", count: 0, percent: 0 });
    expect(bands[11]).toEqual({ label: "241~255", count: 4, percent: 50 });
  });

  const threeRounds = () =>
    stats({
      totalDraws: 3,
      sumDistribution: [
        { sum: 30, count: 1 },
        { sum: 60, count: 1 },
        { sum: 200, count: 1 },
      ],
      recentGrid: [
        { round: 1, numbers: [10, 10, 10, 10, 10, 10] },
        { round: 2, numbers: [5, 5, 5, 5, 5, 5] },
        { round: 3, numbers: [30, 30, 30, 30, 40, 40] },
      ],
    });

  it("sumsUntil — 1회부터 그 위치의 회차까지만 센 합계 분포, 축을 주지 않으면 쌓은 회차의 양 끝이 축이다", () => {
    const cut = threeRounds().sumsUntil(1);
    expect(cut.totalDraws).toBe(2);
    expect(cut.sumDistribution).toEqual([
      { sum: 30, count: 1 },
      { sum: 60, count: 1 },
    ]);
    expect(cut.sumChart).toMatchObject({ minSum: 30, maxSum: 60, maxCount: 1 });
    expect(cut.sumRatio(45)).toBe(0.5);
    expect(cut.sumBands[0]).toEqual({ label: "21~40", count: 1, percent: 50 });
  });

  it("paddedSumAxis — 양 끝에서 5 이상 떨어진 20 단위 경계, 21~255 안", () => {
    const axisOf = (sums: number[]) => stats({ sumDistribution: sums.map((sum) => ({ sum, count: 1 })) }).paddedSumAxis;
    expect(axisOf([48, 238])).toEqual({ min: 40, max: 255 });
    expect(axisOf([79, 196])).toEqual({ min: 60, max: 220 });
    // 새 극값이 같은 경계 안이면 축은 그대로다
    expect(axisOf([66, 210])).toEqual({ min: 60, max: 220 });
    expect(axisOf([24, 100])).toEqual({ min: 21, max: 120 });
    expect(axisOf([])).toBeNull();
  });

  it("sumsUntil — 축을 주면 그 축으로 고정한다(절대 길이)", () => {
    const cut = threeRounds().sumsUntil(1, { min: 21, max: 255 });
    expect(cut.sumChart).toMatchObject({ minSum: 21, maxSum: 255 });
    expect(cut.sumRatio(138)).toBe(0.5);
  });

  it("sumChart — 세로축 눈금은 0 부터 최다 건수까지 1·2·5 단위의 깔끔한 간격, y 는 0~1 비율", () => {
    const ticksOf = (max: number) =>
      stats({ sumDistribution: [{ sum: 100, count: max }] }).sumChart?.yTicks.map((t) => t.count);
    expect(ticksOf(4)).toEqual([0, 1, 2, 3, 4]);
    expect(ticksOf(23)).toEqual([0, 10, 20]);
    expect(ticksOf(37)).toEqual([0, 10, 20, 30]);
    expect(ticksOf(1)).toEqual([0, 1]);
    expect(stats({ sumDistribution: [{ sum: 100, count: 20 }] }).sumChart?.yTicks[2]).toEqual({ count: 10, y: 0.5 });
  });

  it("sumChart — 가로축 눈금은 양 끝 사이의 20 배수 합계, x 는 0~1 비율", () => {
    const chart = stats({
      sumDistribution: [
        { sum: 48, count: 1 },
        { sum: 128, count: 1 },
      ],
    }).sumChart;
    expect(chart?.xTicks.map((t) => t.sum)).toEqual([60, 80, 100, 120]);
    expect(chart?.xTicks[0]?.x).toBeCloseTo(12 / 80);
  });

  it("sumChart — 분포가 비면 null", () => {
    expect(stats({ sumDistribution: [] }).sumChart).toBeNull();
  });

  it("topPairBars — 1위 대비 너비", () => {
    expect(
      stats({
        topPairs: [
          { a: 1, b: 2, count: 8 },
          { a: 3, b: 4, count: 2 },
        ],
      }).topPairBars,
    ).toEqual([
      { pair: [1, 2], count: 8, widthPercent: 100 },
      { pair: [3, 4], count: 2, widthPercent: 25 },
    ]);
  });

  it("gridColumn — 회차마다 45칸, 출현 여부와 칸 제목", () => {
    const columns = [StatisticsViewModel.gridColumn({ round: 5, numbers: [1, 3] })];
    expect(columns).toHaveLength(1);
    expect(columns[0]?.round).toBe(5);
    expect(columns[0]?.cells).toHaveLength(45);
    expect(columns[0]?.cells[0]).toEqual({ n: 1, present: true, title: "제5회 · 1번 출현" });
    expect(columns[0]?.cells[1]).toEqual({ n: 2, present: false, title: "제5회 · 2번" });
    expect(columns[0]?.cells[44]).toEqual({ n: 45, present: false, title: "제5회 · 45번" });
  });

  it("gridColumn — 같은 회차 항목이면 같은 열 객체를 돌려준다(타임라인을 끌 때 열을 다시 그리지 않는다)", () => {
    const entry = { round: 7, numbers: [2, 4] };
    expect(StatisticsViewModel.gridColumn(entry)).toBe(StatisticsViewModel.gridColumn(entry));
  });

  it("oddBars — 회차 대비 반올림 비율과 6+최다 대비×56 높이", () => {
    const bars = stats({ totalDraws: 100, oddCountDist: [0, 0, 10, 30, 40, 15, 5] }).oddBars;
    expect(bars.map((b) => b.label)).toEqual(["홀0", "홀1", "홀2", "홀3", "홀4", "홀5", "홀6"]);
    expect(bars.map((b) => b.percent)).toEqual([0, 0, 10, 30, 40, 15, 5]);
    expect(bars.map((b) => b.heightPx)).toEqual([6, 6, 20, 48, 62, 27, 13]);
    expect(bars.map((b) => b.count)).toEqual([0, 0, 10, 30, 40, 15, 5]);
  });

  it("lowBars — 저구간 라벨, 회차가 없으면 비율 0", () => {
    const bars = stats({ totalDraws: 0, lowCountDist: [1, 3] }).lowBars;
    expect(bars).toEqual([
      { label: "저0", count: 1, percent: 0, heightPx: 6 + (1 / 3) * 56 },
      { label: "저1", count: 3, percent: 0, heightPx: 62 },
    ]);
  });

  it("zoneBars — 구간 라벨과 구간 합계 대비 비율", () => {
    const bars = stats({ zoneCounts: [10, 20, 30, 25, 15] }).zoneBars;
    expect(bars.map((b) => b.label)).toEqual(["1-10", "11-20", "21-30", "31-40", "41-45"]);
    expect(bars.map((b) => b.percent)).toEqual([10, 20, 30, 25, 15]);
    expect(bars.map((b) => b.heightPx)).toEqual([
      6 + (10 / 30) * 56,
      6 + (20 / 30) * 56,
      62,
      6 + (25 / 30) * 56,
      34,
    ]);
  });
});
