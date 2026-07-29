import { describe, expect, it } from "vitest";
import { createDummyDrawDataAdapter } from "./dummy-draw-data.adapter";

describe("DummyDrawDataAdapter (결정적 생성 데이터)", () => {
  it("요청한 회차 수만큼 오름차순으로 생성한다", async () => {
    const draws = await createDummyDrawDataAdapter({ rounds: 100 }).getAllDraws();
    expect(draws).toHaveLength(100);
    expect(draws[0]?.round).toBe(1);
    expect(draws[99]?.round).toBe(100);
  });

  it("모든 회차가 유효하다 — 6개·1~45·중복 없음·보너스 별도", async () => {
    const draws = await createDummyDrawDataAdapter({ rounds: 200 }).getAllDraws();
    for (const d of draws) {
      expect(d.numbers).toHaveLength(6);
      expect(new Set(d.numbers).size).toBe(6);
      expect(d.numbers.every((n) => n >= 1 && n <= 45)).toBe(true);
      expect([...d.numbers]).toEqual([...d.numbers].sort((a, b) => a - b));
      expect(d.bonus).toBeGreaterThanOrEqual(1);
      expect(d.bonus).toBeLessThanOrEqual(45);
      expect(d.numbers).not.toContain(d.bonus);
    }
  });

  it("같은 시드는 항상 같은 데이터 (결정성)", async () => {
    const a = await createDummyDrawDataAdapter({ rounds: 50, seed: 7 }).getAllDraws();
    const b = await createDummyDrawDataAdapter({ rounds: 50, seed: 7 }).getAllDraws();
    expect(a).toEqual(b);
    const c = await createDummyDrawDataAdapter({ rounds: 50, seed: 8 }).getAllDraws();
    expect(a).not.toEqual(c);
  });

  it("1회차는 2002-12-07 20:35 KST, 주 1회 간격", async () => {
    const draws = await createDummyDrawDataAdapter({ rounds: 2 }).getAllDraws();
    expect(draws[0]?.drawnAt).toBe("2002-12-07T11:35:00.000Z");
    expect(draws[1]?.drawnAt).toBe("2002-12-14T11:35:00.000Z");
  });
});
