import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { useResultsCardPresenter } from "../ResultsCard.presenter";

const sentTo = (http: TestHttpClient, path: string) => http.sent.filter((s) => s.path === path).length;

function setup() {
  const http = new TestHttpClient();
  overrideStore("infra.http", () => ({ client: http }));
  http.respond("/api/picks", () =>
    http.sent.at(-1)!.init.method === "POST" ? { id: "p1", numbers: [1, 2, 3, 4, 5, 6], createdAt: "2026-10-22T00:00:00.000Z" } : [],
  );
  http.respond("/api/results", () => ({ draw: { round: 1234, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 }, items: [] }));
  return http;
}

describe("api.home.ResultsCard.check", () => {
  it("픽이 바뀌어도 당첨 대조는 다시 받지 않는다", async () => {
    const http = setup();
    await getStore("api.home.ResultsCard.check").getState().fetch();
    await getStore("api.home.PicksCard.picks").getState().save([1, 2, 3, 4, 5, 6]);
    expect(sentTo(http, "/api/results")).toBe(1);
  });

  it("event.home.PicksCard.changed 의 record().exempt 에 당첨 대조와 그 까닭이 있다", () => {
    getStore("api.home.ResultsCard.check").getState();
    expect(getStore("event.home.PicksCard.changed").getState().record().exempt).toContainEqual({
      who: "api.home.ResultsCard.check",
      why: "결과는 사람이 「당첨 대조」를 눌러 받는다 — 누르기 전까지 앞선 결과를 그대로 보인다",
    });
  });

  it("화면이 떠도 받지 않고 refetch 로 받는다", async () => {
    const http = setup();
    const { result } = renderHook(() => useResultsCardPresenter());
    expect(result.current.checked).toBe(false);
    expect(sentTo(http, "/api/results")).toBe(0);
    await act(() => result.current.check());
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.subtitle).toBe("제1234회 당첨 번호와 대조");
    expect(sentTo(http, "/api/results")).toBe(1);
  });
});
