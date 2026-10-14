import { describe, expect, it } from "vitest";
import type { LotterietusDraw as Draw } from "@fortuna-lottery/contract/lotterietus";
import {
  assumedCombinations,
  binomial,
  combinationKey,
  hitRate,
  topNumbers,
  walkRounds,
} from "./assumption.js";
import type { Assumption } from "../domain/model/Assumption.model.js";

/** 번호 목록으로 round 1..n 회차를 짓는다. */
const draws = (list: number[][]): Draw[] =>
  list.map((numbers, i) => ({ round: i + 1, numbers, bonus: 45, drawnAt: "2026-01-01" }));

/** 회차마다 다른 조합 n 개. i 번째는 base..base+5 (base 는 1..40). */
const varied = (n: number): number[][] =>
  Array.from({ length: n }, (_, i) => {
    const base = ((i * 7) % 40) + 1;
    return [0, 1, 2, 3, 4, 5].map((d) => base + d);
  });

describe("binomial", () => {
  it("이항계수를 낸다", () => {
    expect(binomial(45, 6)).toBe(8_145_060);
    expect(binomial(20, 6)).toBe(38_760);
    expect(binomial(6, 6)).toBe(1);
  });
});

describe("combinationKey", () => {
  it("오름차순 정렬 뒤 쉼표로 잇는다", () => {
    expect(combinationKey([6, 1, 10, 2, 3, 4])).toBe("1,2,3,4,6,10");
  });
});

describe("topNumbers", () => {
  it("출현 횟수 내림차순, 같으면 작은 번호 먼저, 결과는 오름차순", () => {
    const d = draws([
      [7, 3, 9, 20, 21, 22],
      [7, 3, 9, 30, 31, 32],
      [7, 40, 41, 42, 43, 44],
    ]);
    expect(topNumbers(d, 2)).toEqual([3, 7]);
  });
});

describe("assumedCombinations", () => {
  it("과거 1등 제외: 서로 다른 조합 수만큼 뺀다", () => {
    const d = draws([
      [1, 2, 3, 4, 5, 6],
      [6, 5, 4, 3, 2, 1],
      [10, 11, 12, 13, 14, 15],
    ]);
    const r = assumedCombinations({ excludePastWinners: true, topK: null }, d);
    expect(r.count).toBe(8_145_060 - 2);
    expect(r.pool).toHaveLength(45);
  });

  it("상위 K 만: binomial(K, 6)", () => {
    const r = assumedCombinations({ excludePastWinners: false, topK: 20 }, draws(varied(30)));
    expect(r.count).toBe(38_760);
    expect(r.pool).toHaveLength(20);
  });

  it("남은 조합 0 개", () => {
    const d = draws(Array.from({ length: 5 }, () => [1, 2, 3, 4, 5, 6]));
    expect(assumedCombinations({ excludePastWinners: true, topK: 6 }, d).count).toBe(0);
  });
});

describe("hitRate", () => {
  const a: Assumption = { excludePastWinners: true, topK: 20 };

  it("워밍업: 앞선 회차가 100 개 미만인 회차는 세지 않는다", () => {
    expect(hitRate(a, draws(varied(100)))).toEqual({ hits: 0, rounds: 0, expectedRate: 0 });
    expect(hitRate(a, draws(varied(105))).rounds).toBe(5);
  });

  it("가정 A: 과거 1등과 같은 조합은 적중이 아니다", () => {
    const list = varied(101);
    list[100] = [...list[0]!];
    const d = draws(list);
    expect(hitRate({ excludePastWinners: true, topK: null }, d)).toMatchObject({ hits: 0, rounds: 1 });
    expect(hitRate({ excludePastWinners: false, topK: null }, d)).toMatchObject({ hits: 1, rounds: 1 });
  });

  it("expectedRate 는 before.count / TOTAL_COMBINATIONS 평균", () => {
    const r = hitRate({ excludePastWinners: false, topK: 20 }, draws(varied(103)));
    expect(r.expectedRate).toBeCloseTo(38_760 / 8_145_060, 12);
  });
});

describe("walkRounds", () => {
  const a: Assumption = { excludePastWinners: true, topK: 20 };
  const record = (d: Draw[]) => {
    let seen: { pool: number[]; hit: boolean } | undefined;
    walkRounds(a, d, (draw, before) => {
      if (draw.round !== 101) return;
      const hit =
        draw.numbers.every((n) => before.pool.includes(n)) &&
        !before.pastKeys.has(combinationKey(draw.numbers));
      seen = { pool: before.pool, hit };
    });
    return seen;
  };

  it("누설 없음: 회차 101 뒤를 바꿔도 회차 101 의 판정이 같다", () => {
    const list = varied(110);
    const first = record(draws(list));
    const changed = list.map((ns, i) => (i >= 101 ? [2, 4, 6, 8, 10, 12] : ns));
    const second = record(draws(changed));
    expect(first).toBeDefined();
    expect(second).toEqual(first);
  });

  it("before 는 앞선 회차만 센다", () => {
    const list = varied(101);
    list[100] = [1, 3, 5, 7, 9, 11];
    const d = draws(list);
    let before: { pool: number[]; pastKeys: ReadonlySet<string> } | undefined;
    walkRounds(a, d, (_draw, b) => (before = b));
    expect(before!.pool).toEqual(topNumbers(d.slice(0, 100), 20));
    expect(before!.pastKeys.has("1,3,5,7,9,11")).toBe(false);
    expect(before!.pastKeys.size).toBe(new Set(d.slice(0, 100).map((x) => combinationKey(x.numbers))).size);
  });
});
