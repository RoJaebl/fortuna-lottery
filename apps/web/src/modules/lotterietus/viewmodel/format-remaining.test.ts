import { describe, expect, it } from "vitest";
import { formatRemaining } from "./use-lotterietus.viewmodel";

describe("formatRemaining (카운트다운 presenter)", () => {
  it("일 단위가 있으면 D-표기", () => {
    const ms = ((3 * 86400 + 2 * 3600 + 4 * 60 + 5) * 1000);
    expect(formatRemaining(ms)).toBe("D-3 02:04:05");
  });

  it("하루 미만이면 시:분:초", () => {
    expect(formatRemaining(3661 * 1000)).toBe("01:01:01");
  });

  it("0 이하이면 추첨 시간", () => {
    expect(formatRemaining(0)).toBe("추첨 시간!");
    expect(formatRemaining(-100)).toBe("추첨 시간!");
  });
});
