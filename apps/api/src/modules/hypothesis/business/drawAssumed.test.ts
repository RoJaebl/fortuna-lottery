import { describe, expect, it } from "vitest";
import { mulberry32 } from "@fortuna-lottery/kernel";
import { combinationKey } from "./assumption.js";
import { drawAssumed } from "./drawAssumed.js";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("drawAssumed", () => {
  it("남은 조합이 0 이면 거절한다", () => {
    const r = drawAssumed(mulberry32(1), { excludePastWinners: false, topK: null }, range(45), new Set(), 0);
    expect(r).toEqual({ ok: false, error: "이 가정 아래 남은 조합이 없습니다" });
  });

  it("풀 안의 번호만 뽑는다", () => {
    for (let s = 0; s < 20; s++) {
      const r = drawAssumed(mulberry32(s), { excludePastWinners: false, topK: 10 }, range(10), new Set(), 210);
      expect(r.ok && r.value.every((n) => n <= 10)).toBe(true);
    }
  });

  it("과거 1등 조합을 빼고 남은 하나만 낸다", () => {
    const pool = range(7);
    const all = pool.map((skip) => pool.filter((n) => n !== skip));
    const left = all[0]!;
    const past = new Set(all.slice(1).map(combinationKey));
    for (let s = 0; s < 10; s++) {
      const r = drawAssumed(mulberry32(s), { excludePastWinners: true, topK: 7 }, pool, past, 1);
      expect(r.ok && combinationKey(r.value)).toBe(combinationKey(left));
    }
  });
});
