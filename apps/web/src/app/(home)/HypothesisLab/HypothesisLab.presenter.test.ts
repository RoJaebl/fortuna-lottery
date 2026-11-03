import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { assumptionRequest, useHypothesisLabPresenter } from "./HypothesisLab.presenter";

describe("assumptionRequest", () => {
  const base = {
    range: { min: 121, max: 160 },
    excludePastWinners: true,
    topKEnabled: false,
    topK: 20,
    fixed: [7],
    untilRound: null,
  };

  it("K 스위치가 꺼져 있으면 topK 를, 최신 회차면 untilRound 를 싣지 않는다", () => {
    expect(assumptionRequest(base)).toEqual({ sumRange: { min: 121, max: 160 }, excludePastWinners: true, fixed: [7] });
  });

  it("K 스위치가 켜져 있으면 topK 를, 회차를 골랐으면 untilRound 를 싣는다", () => {
    expect(assumptionRequest({ ...base, topKEnabled: true, topK: 6, untilRound: 300 })).toEqual({
      sumRange: { min: 121, max: 160 },
      excludePastWinners: true,
      fixed: [7],
      topK: 6,
      untilRound: 300,
    });
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
  sumRange: { min: 121, max: 160 },
  sumRangeCombinations: { total: 38760, excluded: 0 },
  theoryRate: 0.5,
  pastRate: 0.5,
  expectedHits: 1,
  denominators: { past: 4, theory: 8145060 },
  sumCounts: [],
  frequentBands: [],
  maxWindowRate: 0.5,
  emptyBands: [],
  numbers: Array.from({ length: 45 }, (_, i) => ({ n: i + 1, possible: true, count: 0 })),
};

type Body = { sumRange: { min: number; max: number }; untilRound?: number; fixed: number[] };
const bodyOf = (sent: { init: RequestInit }) => JSON.parse(sent.init.body as string) as Body;

/** 평가는 EVALUATION 을(센 회차 수는 요청의 untilRound), 최신 회차는 1245 를, 인기 패턴은 빈 목록을 돌려준다 */
function setup(numbers: number[] | null = null) {
  const http = new TestHttpClient();
  http.respond("/api/hypothesis/evaluate", () => {
    const body = bodyOf(http.sent.at(-1)!);
    return { ...EVALUATION, hitRate: { ...EVALUATION.hitRate, rounds: body.untilRound ?? 1245 } };
  });
  http.respond("/api/lotterietus", () => ({ round: 1245 }));
  http.respond("/api/hypothesis/popularity", () => ({ patterns: [] }));
  overrideStore("infra.http", () => ({ client: http }));
  if (numbers) getStore("state.home.combination").getState().choose(numbers);
  return http;
}

const evaluations = (http: TestHttpClient) => http.sent.filter((s) => s.path === "/api/hypothesis/evaluate").map(bodyOf);

describe("useHypothesisLabPresenter — 평가는 지금 가정의 조회다", () => {
  it("처음 그리면 기본 구간 121~160 으로 평가를 받는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(evaluations(http)).toEqual([{ sumRange: { min: 121, max: 160 }, excludePastWinners: true, topK: 20, fixed: [] }]);
  });

  it("구간을 바꾸면 멈춘 뒤 바뀐 sumRange 로 한 번 받는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.result).not.toBeNull());
    act(() => result.current.controls.changeMin("100"));
    act(() => result.current.controls.changeMax("110"));
    expect(result.current.controls).toMatchObject({ min: 100, max: 110 });
    await waitFor(() => expect(evaluations(http)).toHaveLength(2), { timeout: 1000 });
    expect(evaluations(http)[1]!.sumRange).toEqual({ min: 100, max: 110 });
  });

  it("차트에서 거꾸로 끌어도 정렬해 보인다", () => {
    setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    act(() => result.current.chart.onSelect(200, 150));
    expect(result.current.chart.selected).toEqual({ min: 150, max: 200 });
  });

  it("번호를 고르면 fixed 에 실어 다시 받는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.result).not.toBeNull());
    act(() => getStore("state.home.HypothesisLab.switches").getState().toggleFixed(7));
    await waitFor(() => expect(evaluations(http).at(-1)!.fixed).toEqual([7]));
  });
});

describe("useHypothesisLabPresenter — 재생 바", () => {
  it("최신 회차까지 서고, 고른 회차를 untilRound 로 보낸다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.timeline).not.toBeNull());
    expect(result.current.timeline).toMatchObject({ total: 1245, position: 1244, speed: 1 });
    expect(result.current.timeline!.roundAt(0)).toBe(1);
    act(() => result.current.timeline!.onSeek(299));
    expect(result.current.timeline!.position).toBe(299);
    await waitFor(() => expect(evaluations(http).at(-1)!.untilRound).toBe(300));
    // 맨 끝을 고르면 다시 「최신」이다
    act(() => result.current.timeline!.onSeek(1244));
    expect(getStore("state.home.HypothesisLab.switches").getState().untilRound).toBeNull();
  });

  it("회차를 빠르게 셋 바꾸면 늦게 온 첫 응답이 셋째 화면을 덮지 않는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.timeline).not.toBeNull());

    const gates = new Map<number, () => void>();
    http.respond("/api/hypothesis/evaluate", () => {
      const rounds = bodyOf(http.sent.at(-1)!).untilRound!;
      return new Promise((resolve) =>
        gates.set(rounds, () => resolve({ ...EVALUATION, hitRate: { ...EVALUATION.hitRate, rounds } })),
      );
    });
    act(() => result.current.timeline!.onSeek(99));
    act(() => result.current.timeline!.onSeek(199));
    act(() => result.current.timeline!.onSeek(299));
    await waitFor(() => expect(gates.size).toBe(3));

    await act(async () => gates.get(300)!());
    await waitFor(() => expect(result.current.result?.rows.past.sumInRange).toBe("50.0% · 300회 중 1회"));
    await act(async () => {
      gates.get(100)!();
      gates.get(200)!();
    });
    expect(result.current.result?.rows.past.sumInRange).toBe("50.0% · 300회 중 1회");
  });
});

describe("useHypothesisLabPresenter — 나머지 자동 채우기", () => {
  it("지금 가정(고른 번호 포함)으로 뽑아 현재 조합으로 넘긴다", async () => {
    const http = setup();
    http.respond("/api/hypothesis/generate", () => ({ numbers: [7, 20, 21, 22, 23, 30] }));
    const { result } = renderHook(() => useHypothesisLabPresenter());
    await waitFor(() => expect(result.current.result).not.toBeNull());
    act(() => result.current.result!.board[6]!.onToggle());
    await act(async () => result.current.result!.autoFill.onClick());

    await waitFor(() => expect(getStore("state.home.combination").getState().numbers).toEqual([7, 20, 21, 22, 23, 30]));
    const generate = http.sent.find((s) => s.path === "/api/hypothesis/generate")!;
    expect(bodyOf(generate)).toMatchObject({ sumRange: { min: 121, max: 160 }, fixed: [7] });
  });
});

describe("useHypothesisLabPresenter — 인기 패턴 요청", () => {
  it("현재 조합이 없으면 인기 패턴을 묻지 않는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useHypothesisLabPresenter());

    await act(async () => {});
    expect(http.sent.filter((s) => s.path === "/api/hypothesis/popularity")).toHaveLength(0);
    expect(result.current.popularity.messages).toBeNull();
  });

  it("현재 조합이 있으면 그 조합으로 묻는다", async () => {
    const http = setup([1, 2, 3, 4, 5, 6]);
    const { result } = renderHook(() => useHypothesisLabPresenter());

    await waitFor(() => expect(result.current.popularity.messages).toEqual(["알려진 인기 패턴이 없습니다."]));
    const asked = http.sent.filter((s) => s.path === "/api/hypothesis/popularity");
    expect(asked.map(bodyOf)).toEqual([{ numbers: [1, 2, 3, 4, 5, 6] }]);
  });
});
