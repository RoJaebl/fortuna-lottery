import { describe, expect, it } from "vitest";
import { getStore, overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";

const switches = () => getStore("state.home.HypothesisLab.switches").getState();

describe("state.home.HypothesisLab.switches", () => {
  it("처음 값 — 제외·K 끔, 과거 비율로 계산, 고른 번호 없음, 최신 회차, 1 배속", () => {
    expect(switches()).toMatchObject({
      excludePastWinners: false,
      topKEnabled: false,
      pastRateMode: true,
      fixed: [],
      untilRound: null,
      playSpeed: 1,
    });
  });

  it("keepInPool 은 풀 밖의 고른 번호를 버린다", () => {
    for (const n of [3, 14, 45]) switches().toggleFixed(n);
    switches().keepInPool([1, 3, 14, 20]);
    expect(switches().fixed).toEqual([3, 14]);
  });

  it("toggleFixed 는 넣고 빼며, 다섯 개를 넘겨 넣지 않는다", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) switches().toggleFixed(n);
    expect(switches().fixed).toEqual([1, 2, 3, 4, 5]);
    switches().toggleFixed(3);
    expect(switches().fixed).toEqual([1, 2, 4, 5]);
  });

  it("과거 비율 계산·센 회차·배속을 바꾼다 — 받는 중인 평가가 없으면 회차를 곧바로 들인다", async () => {
    const http = new TestHttpClient();
    http.respond("/api/hypothesis/evaluate", () => new Promise(() => {}));
    overrideStore("infra.http", () => ({ client: http }));
    switches().togglePastRateMode();
    switches().changeUntilRound(300);
    switches().changePlaySpeed(5);
    expect(switches()).toMatchObject({ pastRateMode: false, untilRound: 300, committedUntilRound: 300, playSpeed: 5 });
    // 받는 중이면 재생 바 값만 바뀌고 들인 회차는 그대로다
    switches().changeUntilRound(400);
    expect(switches()).toMatchObject({ untilRound: 400, committedUntilRound: 300 });
    await new Promise((r) => setTimeout(r, 0));
    // 화면이 없으면 문이 스스로 받는다 — 하나만
    expect(http.sent).toHaveLength(1);
  });
});
