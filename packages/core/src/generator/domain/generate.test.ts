import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../shared/rng";
import { generate } from "./generate";

describe("generate (조합 생성)", () => {
  it("자동 — 유효한 6개 조합을 만든다 (결정적 시드)", () => {
    const r = generate(mulberry32(42));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toHaveLength(6);
      expect(new Set(r.value).size).toBe(6);
      expect(r.value.every((n) => n >= 1 && n <= 45)).toBe(true);
      // 같은 시드 = 같은 결과
      const r2 = generate(mulberry32(42));
      expect(r2.ok && [...r2.value]).toEqual([...r.value]);
    }
  });

  it("부분 선택 — 고정 번호를 반드시 포함한다", () => {
    const r = generate(mulberry32(1), [7, 14]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toContain(7);
      expect(r.value).toContain(14);
      expect(r.value).toHaveLength(6);
    }
  });

  it("직접 입력 — 6개 고정이면 그대로 (정렬만)", () => {
    const r = generate(mulberry32(1), [45, 1, 22, 7, 33, 14]);
    expect(r.ok && [...r.value]).toEqual([1, 7, 14, 22, 33, 45]);
  });

  it("제외 번호는 절대 포함하지 않는다", () => {
    const excluded = Array.from({ length: 39 }, (_, i) => i + 1); // 1~39 제외 → 40~45만 남음
    const r = generate(mulberry32(9), [], excluded);
    expect(r.ok && [...r.value]).toEqual([40, 41, 42, 43, 44, 45]);
  });

  it("고정 번호가 7개 이상이면 실패한다", () => {
    expect(generate(mulberry32(1), [1, 2, 3, 4, 5, 6, 7]).ok).toBe(false);
  });

  it("고정 번호 중복·범위 초과는 실패한다", () => {
    expect(generate(mulberry32(1), [1, 1]).ok).toBe(false);
    expect(generate(mulberry32(1), [46]).ok).toBe(false);
  });

  it("고정과 제외가 겹치면 실패한다", () => {
    expect(generate(mulberry32(1), [7], [7]).ok).toBe(false);
  });

  it("제외가 너무 많아 6개를 못 채우면 실패한다", () => {
    const excluded = Array.from({ length: 40 }, (_, i) => i + 1); // 41~45만 남음 (5개)
    expect(generate(mulberry32(1), [], excluded).ok).toBe(false);
  });
});
