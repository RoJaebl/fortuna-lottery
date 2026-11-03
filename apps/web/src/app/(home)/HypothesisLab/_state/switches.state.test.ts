import { describe, expect, it } from "vitest";
import { getStore } from "supa-store";

const switches = () => getStore("state.home.HypothesisLab.switches").getState();

describe("state.home.HypothesisLab.switches", () => {
  it("처음 값 — 과거 비율로 계산, 고른 번호 없음, 최신 회차, 1 배속", () => {
    expect(switches()).toMatchObject({ pastRateMode: true, fixed: [], untilRound: null, playSpeed: 1 });
  });

  it("toggleFixed 는 넣고 빼며, 다섯 개를 넘겨 넣지 않는다", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) switches().toggleFixed(n);
    expect(switches().fixed).toEqual([1, 2, 3, 4, 5]);
    switches().toggleFixed(3);
    expect(switches().fixed).toEqual([1, 2, 4, 5]);
  });

  it("과거 비율 계산·센 회차·배속을 바꾼다", () => {
    switches().togglePastRateMode();
    switches().changeUntilRound(300);
    switches().changePlaySpeed(5);
    expect(switches()).toMatchObject({ pastRateMode: false, untilRound: 300, playSpeed: 5 });
  });
});
