import { describe, expect, it } from "vitest";
import type { Draw } from "../../draw/domain/draw";
import {
  frequency,
  hotCold,
  lowCountDistribution,
  oddCountDistribution,
  sumDistribution,
  topPairs,
  zoneCounts,
} from "./calculations";

const draw = (round: number, numbers: number[], bonus = 45): Draw => ({
  round,
  numbers,
  bonus,
  drawnAt: `2020-01-0${round}T11:35:00.000Z`,
});

// 검증용 소형 픽스처: 계산을 손으로 확인할 수 있는 크기
const DRAWS: Draw[] = [
  draw(1, [1, 2, 3, 11, 23, 41]), // 합 81, 홀 5, 저 4
  draw(2, [1, 2, 13, 24, 35, 44]), // 합 119, 홀 3, 저 3
  draw(3, [1, 12, 23, 24, 35, 45]), // 합 140, 홀 4, 저 2
];

describe("statistics 순수 계산 함수", () => {
  it("frequency — 번호별 출현 횟수", () => {
    const f = frequency(DRAWS);
    expect(f[0]).toBe(3); // 번호 1: 3회
    expect(f[1]).toBe(2); // 번호 2: 2회
    expect(f[22]).toBe(2); // 번호 23: 2회
    expect(f[44]).toBe(1); // 번호 45: 1회
    expect(f.reduce((a, b) => a + b, 0)).toBe(18); // 3회차 × 6개
  });

  it("sumDistribution — 합계별 횟수 (정렬)", () => {
    expect(sumDistribution(DRAWS)).toEqual([
      { sum: 81, count: 1 },
      { sum: 119, count: 1 },
      { sum: 140, count: 1 },
    ]);
  });

  it("oddCountDistribution — 홀수 개수 분포", () => {
    const d = oddCountDistribution(DRAWS);
    expect(d[3]).toBe(1);
    expect(d[4]).toBe(1);
    expect(d[5]).toBe(1);
    expect(d.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("lowCountDistribution — 저구간(1~22) 개수 분포", () => {
    const d = lowCountDistribution(DRAWS);
    expect(d[4]).toBe(1); // 1회차: 1,2,3,11 → 4개
    expect(d[3]).toBe(1); // 2회차: 1,2,13 → 3개
    expect(d[2]).toBe(1); // 3회차: 1,12 → 2개
  });

  it("zoneCounts — 구간별 총 출현", () => {
    // 1-10: [1,2,3]+[1,2]+[1] = 6 / 11-20: [11]+[13]+[12] = 3
    // 21-30: [23]+[24]+[23,24] = 4 / 31-40: [35]+[35] = 2 / 41-45: [41]+[44]+[45] = 3
    expect(zoneCounts(DRAWS)).toEqual([6, 3, 4, 2, 3]);
  });

  it("hotCold — 미출현 기간 (최신 회차 기준)", () => {
    const hc = hotCold(DRAWS);
    const byNumber = new Map(hc.map((h) => [h.number, h]));
    expect(byNumber.get(1)?.gap).toBe(0); // 3회차(최신)에 출현
    expect(byNumber.get(2)?.gap).toBe(1); // 2회차가 마지막
    expect(byNumber.get(41)?.gap).toBe(2); // 1회차가 마지막
    expect(byNumber.get(7)?.gap).toBe(3); // 한 번도 안 나옴 → 전체 회차 수
    expect(byNumber.get(1)?.count).toBe(3);
  });

  it("topPairs — 동시 출현 페어 상위", () => {
    const pairs = topPairs(DRAWS, 3);
    expect(pairs[0]).toEqual({ a: 1, b: 2, count: 2 }); // (1,2)는 1·2회차에서 2번
    expect(pairs.every((p) => p.a < p.b)).toBe(true);
  });

  it("빈 배열에서도 안전하다", () => {
    expect(frequency([]).every((c) => c === 0)).toBe(true);
    expect(sumDistribution([])).toEqual([]);
    expect(hotCold([]).every((h) => h.gap === 0 && h.count === 0)).toBe(true);
  });
});
