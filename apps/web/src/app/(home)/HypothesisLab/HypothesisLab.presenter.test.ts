import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";
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

function stubFetch() {
  const fetch = vi.fn(async (path: string, _init?: RequestInit) =>
    new Response(JSON.stringify(path.endsWith("/evaluate") ? EVALUATION : { patterns: [] }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** 훅이 유스케이스를 꺼낼 컨테이너 — real 환경이라 위의 fetch 대역이 그대로 받는다 */
function withContainer(numbers: number[] | null = null) {
  const container = createContainer("real");
  if (numbers) container.resolve("state.home.combination").actions.choose(numbers);
  return { wrapper: ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children }) };
}

const calledPaths = (fetch: ReturnType<typeof stubFetch>) => fetch.mock.calls.map(([path]) => path);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useHypothesisLabPresenter — 인기 패턴 요청", () => {
  it("현재 조합이 없으면 인기 패턴을 묻지 않는다", async () => {
    const fetch = stubFetch();
    const { result } = renderHook(() => useHypothesisLabPresenter(), withContainer());

    await act(async () => {});
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.popularityMessages).toBeNull();
  });

  it("현재 조합이 있으면 그 조합으로 묻는다", async () => {
    const fetch = stubFetch();
    const { result } = renderHook(() => useHypothesisLabPresenter(), withContainer([1, 2, 3, 4, 5, 6]));

    await waitFor(() => expect(result.current.popularityMessages).toEqual(["알려진 인기 패턴이 없습니다."]));
    expect(calledPaths(fetch)).toEqual(["/api/hypothesis/popularity"]);
    expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string)).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
  });
});

describe("useHypothesisLabPresenter — 스위치를 바꾸면 평가 결과를 비운다", () => {
  const evaluated = async () => {
    stubFetch();
    const hook = renderHook(() => useHypothesisLabPresenter(), withContainer());
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await gate;
        return new Response(JSON.stringify(EVALUATION), { status: 200 });
      }),
    );
    const { result } = renderHook(() => useHypothesisLabPresenter(), withContainer());
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
