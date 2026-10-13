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
  it("glowIntensity — min~max를 0~1로 정규화", () => {
    expect(StatisticsViewModel.glowIntensity(10, 10, 20)).toBe(0);
    expect(StatisticsViewModel.glowIntensity(20, 10, 20)).toBe(1);
    expect(StatisticsViewModel.glowIntensity(15, 10, 20)).toBe(0.5);
    expect(StatisticsViewModel.glowIntensity(5, 5, 5)).toBe(0.5); // 편차 없음 → 중간값
  });

  it("glows — 번호별 빈도를 그 통계의 min~max 로 정규화한다", () => {
    expect(stats({ frequency: [10, 15, 20] }).glows).toEqual([0, 0.5, 1]);
  });

  it("probabilityFacts — 고정 분모 사실 서술", () => {
    const facts = stats({ totalCombinations: 8_145_060 }).probabilityFacts;
    expect(facts[0]).toContain("8,145,060");
    expect(facts.some((f) => f.includes("동일"))).toBe(true);
  });

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
    expect(vm.sumChart).toEqual({
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

  it("recentRange — 첫 회차와 끝 회차, 없으면 빈 문자열", () => {
    const recentGrid = [
      { round: 5, numbers: [1, 3] },
      { round: 7, numbers: [2] },
    ];
    expect(stats({ recentGrid }).recentRange).toBe("제5회 ~ 제7회 (최근 2회차)");
    expect(stats({ recentGrid: [] }).recentRange).toBe("");
  });

  it("recentColumns — 회차마다 45칸, 출현 여부와 칸 제목", () => {
    const columns = stats({ recentGrid: [{ round: 5, numbers: [1, 3] }] }).recentColumns;
    expect(columns).toHaveLength(1);
    expect(columns[0]?.round).toBe(5);
    expect(columns[0]?.cells).toHaveLength(45);
    expect(columns[0]?.cells[0]).toEqual({ n: 1, present: true, title: "제5회 · 1번 출현" });
    expect(columns[0]?.cells[1]).toEqual({ n: 2, present: false, title: "제5회 · 2번" });
    expect(columns[0]?.cells[44]).toEqual({ n: 45, present: false, title: "제5회 · 45번" });
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
