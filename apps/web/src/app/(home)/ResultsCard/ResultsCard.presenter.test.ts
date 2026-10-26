import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { resultsSubtitle, useResultsCardPresenter } from "./ResultsCard.presenter";

describe("ResultsCard 표시 조정자", () => {
  it("resultsSubtitle — 기준 회차가 있으면 그 회차를, 없으면 안내 문구를", () => {
    expect(resultsSubtitle(1234)).toBe("제1234회 당첨 번호와 대조");
    expect(resultsSubtitle(null)).toBe("저장한 번호를 최신 회차와 대조합니다");
  });
});

describe("useResultsCardPresenter", () => {
  it("앞선 결과가 있어도 다시 대조하는 동안은 「대조 중」이다 — status 는 ready 그대로이고 isFetching 이 참", async () => {
    const http = new TestHttpClient();
    const results = { draw: { round: 1234, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 }, items: [] };
    let calls = 0;
    http.respond("/api/results", () => (++calls === 1 ? results : new Promise(() => {}))); // 둘째 받기는 끝나지 않는다
    overrideStore("infra.http", () => ({ client: http }));
    const { result } = renderHook(() => useResultsCardPresenter());

    await act(() => result.current.check());
    expect(result.current.checked).toBe(true);
    expect(result.current.checkDisabled).toBe(false);

    act(() => void result.current.check());
    await waitFor(() => expect(result.current.checkDisabled).toBe(true));
    expect(result.current.checkLabel).toBe("대조 중…");
    expect(result.current.checked).toBe(true); // 앞선 결과를 그대로 보인다
  });
});
