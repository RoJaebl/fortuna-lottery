import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, overrideStore, resetStores } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { formatRemaining, useLotterietusCardPresenter } from "./LotterietusCard.presenter";
import { LotterietusViewModel } from "./_model/Lotterietus.viewmodel";

/** 회차 응답은 오지 않는다 — 조합을 미리 정한다 */
function withState(numbers: number[] | null = null) {
  resetStores(); // 시험 하나 안에서도 부를 때마다 처음 값에서 시작한다 — 공통 상태는 모듈에 하나뿐이다
  const http = new TestHttpClient();
  http.respond("/api/lotterietus", () => new Promise(() => {}));
  overrideStore("infra.http", () => ({ client: http }));
  if (numbers) getStore("state.home.combination").getState().choose(numbers);
}

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

describe("useLotterietusCardPresenter", () => {
  it("불러오는 중이면 loading 이 참", () => {
    withState();
    const { result } = renderHook(() => useLotterietusCardPresenter());
    expect(result.current.loading).toBe(true);
    expect(result.current.remaining).toBeNull();
  });

  it("앞선 회차가 있으면 다시 받는 중이어도 loading 은 거짓", () => {
    const status = Object.assign(new LotterietusViewModel(), {
      round: 1,
      drawnAt: new Date(2026, 0, 3),
      numbers: [1, 2, 3, 4, 5, 6],
      bonus: 7,
      nextRound: 2,
      nextDrawAt: new Date(Date.now() + 60_000),
    });
    withState();
    const resource = getStore("api.home.LotterietusCard.status").getState();
    resource.setData(status);
    void resource.invalidate(); // 다시 받는 중 — 응답은 오지 않는다
    const { result } = renderHook(() => useLotterietusCardPresenter());
    expect(result.current.loading).toBe(false);
  });
});
