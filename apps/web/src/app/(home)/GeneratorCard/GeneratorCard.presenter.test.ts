import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { overrideStore } from "supa-store";
import { TestHttpClient } from "@infrastructure/http";
import { canGenerate, modeHint, useGeneratorCardPresenter } from "./GeneratorCard.presenter";

/** 생성 응답은 오지 않는다 — 누르면 진행 중에 머문다 */
function setup() {
  const http = new TestHttpClient();
  http.respond("/api/generator", () => new Promise(() => {}));
  overrideStore("infra.http", () => ({ client: http }));
}

describe("GeneratorCard 표시 조정자", () => {
  it("canGenerate — 자동은 언제나, 부분 선택은 1~5개, 직접 입력은 6개일 때만", () => {
    expect(canGenerate("auto", 0)).toBe(true);
    expect(canGenerate("semi", 0)).toBe(false);
    expect(canGenerate("semi", 5)).toBe(true);
    expect(canGenerate("semi", 6)).toBe(false);
    expect(canGenerate("manual", 5)).toBe(false);
    expect(canGenerate("manual", 6)).toBe(true);
  });

  it("modeHint — 모드와 고른 개수로 안내 문구를 만든다", () => {
    expect(modeHint("auto", 0)).toBe("6개 번호를 무작위로 생성합니다");
    expect(modeHint("semi", 2)).toBe("포함할 번호를 1~5개 선택하세요 (2개 선택됨)");
    expect(modeHint("manual", 3)).toBe("6개 번호를 직접 선택하세요 (3/6)");
  });

  it("modeItems · numberItems — 지금 모드와 고른 번호를 항목마다 표시한다", () => {
    setup();
    const { result } = renderHook(() => useGeneratorCardPresenter());
    expect(result.current.modeItems).toEqual([
      { key: "auto", label: "자동", active: true },
      { key: "semi", label: "부분 선택", active: false },
      { key: "manual", label: "직접 입력", active: false },
    ]);
    expect(result.current.numberItems).toHaveLength(45);
    expect(result.current.numberItems.every((item) => !item.selected)).toBe(true);

    act(() => result.current.changeMode("semi"));
    act(() => result.current.toggleNumber(7));
    expect(result.current.modeItems.find((m) => m.active)?.key).toBe("semi");
    expect(result.current.numberItems[6]).toEqual({ n: 7, selected: true });
    expect(result.current.numberItems.filter((item) => item.selected)).toHaveLength(1);
  });

  it("generateDisabled · generateLabel — 생성할 수 없거나 진행 중이면 막는다", () => {
    setup();
    const { result } = renderHook(() => useGeneratorCardPresenter());
    expect(result.current.generateDisabled).toBe(false);
    expect(result.current.generateLabel).toBe("번호 생성");
    act(() => result.current.changeMode("manual"));
    expect(result.current.generateDisabled).toBe(true);

    act(() => result.current.changeMode("auto"));
    act(() => void result.current.generate());
    expect(result.current.generateDisabled).toBe(true);
    expect(result.current.generateLabel).toBe("생성 중…");
  });

  it("모드를 바꾸면 앞선 생성 오류를 지운다", async () => {
    const http = new TestHttpClient();
    http.respond("/api/generator", () => {
      throw new Error("생성 거절");
    });
    overrideStore("infra.http", () => ({ client: http }));
    const { result } = renderHook(() => useGeneratorCardPresenter());
    await act(() => result.current.generate());
    expect(result.current.error).toBe("생성 거절");
    act(() => result.current.changeMode("semi"));
    expect(result.current.error).toBeNull();
  });
});
