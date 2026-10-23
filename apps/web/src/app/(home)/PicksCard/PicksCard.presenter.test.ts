import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, overrideStore } from "@fortuna-lottery/store";
import { TestHttpClient } from "@infrastructure/http";
import { saveButtonLabel, usePicksCardPresenter } from "./PicksCard.presenter";

describe("PicksCard 표시 조정자", () => {
  it("saveButtonLabel — 저장 중 · 저장 가능 · 조합 없음 순으로 문구를 고른다", () => {
    expect(saveButtonLabel(true, true)).toBe("저장 중…");
    expect(saveButtonLabel(false, true)).toBe("현재 번호 저장");
    expect(saveButtonLabel(false, false)).toBe("먼저 번호를 생성하세요");
  });
});

describe("usePicksCardPresenter", () => {
  it("불러오는 중이면 loading 이 참", () => {
    const http = new TestHttpClient();
    http.respond("/api/picks", () => new Promise(() => {})); // 응답이 오지 않는다
    overrideStore("infra.http", () => ({ client: http }));
    const { result } = renderHook(() => usePicksCardPresenter());
    expect(result.current.loading).toBe(true);
    expect(result.current.empty).toBe(false);
  });

  it("저장이 진행 중일 때 다른 픽을 지워도 저장은 계속 진행 중이다", async () => {
    const http = new TestHttpClient();
    http.respond("/api/picks", () => (http.sent.at(-1)!.init.method === "POST" ? new Promise(() => {}) : []));
    http.respond("/api/picks/x", () => undefined);
    overrideStore("infra.http", () => ({ client: http }));
    getStore("state.home.combination").getState().choose([1, 2, 3, 4, 5, 6]);
    const { result } = renderHook(() => usePicksCardPresenter());
    act(() => result.current.saveCurrent());
    expect(result.current.saveLabel).toBe("저장 중…");
    await act(async () => result.current.removePick("x"));
    expect(result.current.saveLabel).toBe("저장 중…");
    expect(result.current.saveDisabled).toBe(true);
  });
});
