import { describe, expect, it } from "vitest";
import { LOW_MAX, NUMBER_ZONES, rankLabel, zoneIndexOf } from "./lotto-rules";

describe("rankLabel", () => {
  it("1~5등은 N등, 0 은 낙첨", () => {
    expect(rankLabel(0)).toBe("낙첨");
    expect([1, 2, 3, 4, 5].map(rankLabel)).toEqual(["1등", "2등", "3등", "4등", "5등"]);
  });
});

describe("NUMBER_ZONES", () => {
  it("1~45 를 빈틈없이 다섯 구간으로 나눈다", () => {
    expect(NUMBER_ZONES.map((z) => z.label)).toEqual(["1-10", "11-20", "21-30", "31-40", "41-45"]);
    expect(NUMBER_ZONES[0]?.from).toBe(1);
    expect(NUMBER_ZONES[4]?.to).toBe(45);
    for (let i = 1; i < NUMBER_ZONES.length; i++) {
      expect(NUMBER_ZONES[i]?.from).toBe((NUMBER_ZONES[i - 1]?.to ?? 0) + 1);
    }
  });
  it("zoneIndexOf — 번호가 속한 구간 (범위 밖은 끝 구간으로 고정)", () => {
    expect([1, 10, 11, 40, 41, 45].map(zoneIndexOf)).toEqual([0, 0, 1, 3, 4, 4]);
    expect(zoneIndexOf(0)).toBe(0);
    expect(zoneIndexOf(99)).toBe(4);
  });
});

describe("LOW_MAX", () => {
  it("저구간 경계는 22", () => {
    expect(LOW_MAX).toBe(22);
  });
});
