import { describe, expect, it } from "vitest";
import { GetNextDrawAt } from "./GetNextDrawAt.js";

// 추첨: 토요일 20:35 KST = 11:35 UTC
describe("GetNextDrawAt (다음 추첨 시각)", () => {
  it("시계가 준 지금 이후 가장 가까운 추첨 시각을 돌려준다", () => {
    // 2026-07-01 은 수요일
    const getNextDrawAt = new GetNextDrawAt(() => new Date("2026-07-01T00:00:00.000Z"));

    expect(getNextDrawAt.execute()).toEqual(new Date("2026-07-04T11:35:00.000Z"));
  });

  it("부를 때마다 시계를 다시 읽는다", () => {
    let now = new Date("2026-07-01T00:00:00.000Z");
    const getNextDrawAt = new GetNextDrawAt(() => now);

    expect(getNextDrawAt.execute()).toEqual(new Date("2026-07-04T11:35:00.000Z"));
    now = new Date("2026-07-04T11:35:00.000Z");
    expect(getNextDrawAt.execute()).toEqual(new Date("2026-07-11T11:35:00.000Z"));
  });
});
