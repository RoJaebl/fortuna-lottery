import { describe, expect, it } from "vitest";
import { mulberry32 } from "@fortuna-lottery/kernel";
import type { Assumption } from "../domain/model/Assumption.model.js";
import { combinationKey } from "./assumption.js";
import { drawAssumed } from "./drawAssumed.js";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const a = (over: Partial<Assumption>): Assumption => ({
  excludePastWinners: false,
  topK: null,
  sumRange: { min: 21, max: 255 },
  fixed: [],
  ...over,
});

describe("drawAssumed", () => {
  it("풀 안의 번호만 뽑는다", () => {
    for (let s = 0; s < 20; s++) {
      const r = drawAssumed(mulberry32(s), a({ topK: 10 }), range(10), new Set());
      expect(r.ok && r.value.every((n) => n <= 10)).toBe(true);
    }
  });

  it("과거 1등 조합을 빼고 남은 하나만 낸다", () => {
    const pool = range(7);
    const all = pool.map((skip) => pool.filter((n) => n !== skip));
    const left = all[0]!;
    const past = new Set(all.slice(1).map(combinationKey));
    for (let s = 0; s < 10; s++) {
      const r = drawAssumed(mulberry32(s), a({ excludePastWinners: true, topK: 7 }), pool, past);
      expect(r.ok && combinationKey(r.value)).toBe(combinationKey(left));
    }
  });

  it("고른 번호를 넣고 합이 구간 안인 조합만 낸다", () => {
    for (let s = 0; s < 20; s++) {
      const as = a({ fixed: [45, 44], sumRange: { min: 100, max: 110 } });
      const r = drawAssumed(mulberry32(s), as, range(45), new Set());
      if (!r.ok) throw new Error(r.error);
      const sum = r.value.reduce((x, y) => x + y, 0);
      expect(r.value).toEqual(expect.arrayContaining([44, 45]));
      expect(sum >= 100 && sum <= 110).toBe(true);
    }
  });

  it("고른 번호와 구간과 제외로 남은 조합이 0 이면 거절한다(고리 없이 끝난다)", () => {
    const as = a({ excludePastWinners: true, fixed: [1, 2, 3, 4, 5], sumRange: { min: 21, max: 21 } });
    const r = drawAssumed(mulberry32(1), as, range(45), new Set(["1,2,3,4,5,6"]));
    expect(r).toEqual({ ok: false, error: "이 가정 아래 남은 조합이 없습니다" });
  });

  it("남은 조합이 하나면 백 번 뽑아도 그 하나다", () => {
    const as = a({ excludePastWinners: true, fixed: [1, 2, 3, 4, 5], sumRange: { min: 21, max: 22 } });
    const past = new Set(["1,2,3,4,5,6"]);
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      expect(drawAssumed(rng, as, range(45), past)).toEqual({ ok: true, value: [1, 2, 3, 4, 5, 7] });
    }
  });

  it("고른 번호가 겹치면 커널 문구로 거절한다", () => {
    const r = drawAssumed(mulberry32(1), a({ fixed: [3, 3] }), range(45), new Set());
    expect(r).toEqual({ ok: false, error: "고정 번호에 중복이 있습니다" });
  });

  it("풀 안에 구간 안 조합이 없으면 거절한다", () => {
    const r = drawAssumed(mulberry32(1), a({ topK: 6, sumRange: { min: 22, max: 30 } }), range(6), new Set());
    expect(r).toEqual({ ok: false, error: "이 가정 아래 남은 조합이 없습니다" });
  });
});
