import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { assumptionRequest, useHypothesisLabPresenter } from "./HypothesisLab.presenter";

describe("assumptionRequest", () => {
  it("K 스위치가 꺼져 있으면 topK 를 싣지 않는다", () => {
    expect(assumptionRequest(true, false, 20)).toEqual({ excludePastWinners: true });
    expect(assumptionRequest(false, true, 6)).toEqual({ excludePastWinners: false, topK: 6 });
  });
});

const EVALUATION = {
  totalCombinations: 8145060,
  assumedCombinations: 38760,
  pool: [1, 2, 3, 4, 5, 6],
  hitRate: { hits: 1, rounds: 2, expectedRate: 0.5 },
  backtest: {
    assumed: { tickets: 20, rankCounts: [20, 0, 0, 0, 0, 0] },
    random: { tickets: 20, rankCounts: [20, 0, 0, 0, 0, 0] },
  },
};

/** 평가는 EVALUATION 을, 인기 패턴은 빈 목록을 돌려준다. 조합을 미리 정한다 */
function setup(numbers: number[] | null = null) {
  const http = new TestHttpClient();
  http.respond("/api/hypothesis/evaluate", () => EVALUATION);
  http.respond("/api/hypothesis/popularity", () => ({ patterns: [] }));
  overrideStore("infra.http", () => ({ client: http }));
  if (numbers) getStore("state.home.combination").getState().choose(numbers);
  return http;
}

describe("useHypothesisLabPresenter — 인기 패턴 요청", () => {
  it("현재 조합이 없으면 인기 패턴을 묻지 않는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());

    await act(async () => {});
    expect(http.sent).toHaveLength(0);
    expect(result.current.popularityMessages).toBeNull();
  });

  it("현재 조합이 있으면 그 조합으로 묻는다", async () => {
    const http = setup([1, 2, 3, 4, 5, 6]);
    const { result } = renderHook(() => useHypothesisLabPresenter());

    await waitFor(() => expect(result.current.popularityMessages).toEqual(["알려진 인기 패턴이 없습니다."]));
    expect(http.sent.map((s) => s.path)).toEqual(["/api/hypothesis/popularity"]);
    expect(JSON.parse(http.sent[0]!.init.body as string)).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
  });
});

describe("useHypothesisLabPresenter — 스위치를 바꾸면 평가 결과를 비운다", () => {
  const evaluated = async () => {
    setup();
    const hook = renderHook(() => useHypothesisLabPresenter());
    await act(async () => hook.result.current.evaluate());
    await waitFor(() => expect(hook.result.current.evaluation).not.toBeNull());
    return hook;
  };

  it("과거 1등 조합 제외를 바꾸면", async () => {
    const { result } = await evaluated();
    act(() => result.current.toggleExcludePastWinners());
    expect(result.current.evaluation).toBeNull();
  });

  it("K 스위치를 바꾸면", async () => {
    const { result } = await evaluated();
    act(() => result.current.toggleTopK());
    expect(result.current.evaluation).toBeNull();
  });

  it("K 값을 바꾸면", async () => {
    const { result } = await evaluated();
    act(() => result.current.changeTopK("6"));
    expect(result.current.evaluation).toBeNull();
  });
});

describe("useHypothesisLabPresenter — 늦게 온 평가 응답", () => {
  it("스위치를 바꾼 뒤 도착한 응답은 버린다", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const http = setup();
    http.respond("/api/hypothesis/evaluate", () => gate.then(() => EVALUATION));
    const { result } = renderHook(() => useHypothesisLabPresenter());
    act(() => result.current.evaluate());
    act(() => result.current.toggleTopK());
    await act(async () => {
      release();
      await gate;
    });
    expect(result.current.evaluation).toBeNull();
    expect(result.current.evaluateDisabled).toBe(false);
  });
});
