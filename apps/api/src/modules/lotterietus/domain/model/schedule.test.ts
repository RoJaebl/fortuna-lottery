import { describe, expect, it } from "vitest";
import { nextDrawAt } from "./schedule.js";

// 추첨: 토요일 20:35 KST = 11:35 UTC
describe("nextDrawAt (다음 추첨 시각)", () => {
  it("평일이면 이번 주 토요일 11:35 UTC", () => {
    // 2026-07-01은 수요일
    const next = nextDrawAt(new Date("2026-07-01T00:00:00.000Z"));
    expect(next.toISOString()).toBe("2026-07-04T11:35:00.000Z");
  });

  it("토요일 추첨 전이면 오늘", () => {
    const next = nextDrawAt(new Date("2026-07-04T10:00:00.000Z"));
    expect(next.toISOString()).toBe("2026-07-04T11:35:00.000Z");
  });

  it("토요일 추첨 직후면 다음 주 토요일", () => {
    const next = nextDrawAt(new Date("2026-07-04T11:35:00.000Z"));
    expect(next.toISOString()).toBe("2026-07-11T11:35:00.000Z");
  });

  it("일요일이면 다음 토요일", () => {
    const next = nextDrawAt(new Date("2026-07-05T00:00:00.000Z"));
    expect(next.toISOString()).toBe("2026-07-11T11:35:00.000Z");
  });
});
