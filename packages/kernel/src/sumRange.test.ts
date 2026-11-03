import { describe, expect, it } from "vitest";
import { mulberry32 } from "./rng.js";
import { countInSumRange, drawInSumRange, listInSumRange } from "./sumRange.js";

const ALL = Array.from({ length: 45 }, (_, i) => i + 1);

describe("countInSumRange (합계 구간 조합 수)", () => {
  it("1~45 에서 6개 — 알려진 값", () => {
    expect(countInSumRange(ALL, 6, 21, 255)).toBe(8_145_060);
    expect(countInSumRange(ALL, 6, 121, 160)).toBe(3_948_748);
    expect(countInSumRange(ALL, 6, 21, 21)).toBe(1);
    expect(countInSumRange(ALL, 6, 255, 255)).toBe(1);
    expect(countInSumRange(ALL, 6, 48, 80)).toBe(212_558);
  });
  it("작은 풀", () => {
    expect(countInSumRange([1, 2, 3, 4, 5, 6, 7], 6, 21, 21)).toBe(1);
  });
});

describe("drawInSumRange (정확 균등 뽑기)", () => {
  it("21~22 — 두 조합이 절반씩 나온다", () => {
    const rnd = mulberry32(1);
    const seen = new Map<string, number>();
    for (let i = 0; i < 2000; i += 1) {
      const r = drawInSumRange(rnd, ALL, [], 21, 22);
      if (!r.ok) throw new Error(r.error);
      const key = r.value.join(",");
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect([...seen.keys()].sort()).toEqual(["1,2,3,4,5,6", "1,2,3,4,5,7"]);
    for (const n of seen.values()) {
      expect(n / 2000).toBeGreaterThan(0.45);
      expect(n / 2000).toBeLessThan(0.55);
    }
  });
  it("고정 5개 + 255~255 → [40..45]", () => {
    const r = drawInSumRange(mulberry32(3), ALL, [40, 41, 42, 43, 44], 255, 255);
    expect(r.ok && [...r.value]).toEqual([40, 41, 42, 43, 44, 45]);
  });
  it("고정 5개 + 21~30 → 남은 조합 없음", () => {
    const r = drawInSumRange(mulberry32(3), ALL, [40, 41, 42, 43, 44], 21, 30);
    expect(r).toEqual({ ok: false, error: "이 가정 아래 남은 조합이 없습니다" });
  });
  it("고정 번호 검증", () => {
    expect(drawInSumRange(mulberry32(1), ALL, [1, 1], 21, 255).ok).toBe(false);
    expect(drawInSumRange(mulberry32(1), ALL, [46], 21, 255).ok).toBe(false);
    expect(drawInSumRange(mulberry32(1), ALL, [1, 2, 3, 4, 5, 6, 7], 21, 255).ok).toBe(false);
  });
});

describe("listInSumRange", () => {
  it("고정 5개 + 21~23 → 6·7·8", () => {
    const l = listInSumRange(ALL, [1, 2, 3, 4, 5], 21, 23);
    expect(l.map((c) => [...c])).toEqual([
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 7],
      [1, 2, 3, 4, 5, 8],
    ]);
  });
});
