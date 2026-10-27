import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStore, resetStores } from "supa-store";
import { useHomePresenter } from "./Home.presenter";

describe("useHomePresenter", () => {
  it("처음 고른 메뉴는 작업실이다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.menu.items).toEqual([{ key: "workroom", label: "작업실" }]);
    expect(result.current.menu.active).toBe("workroom");
  });

  it("탭 목록 끝이 가정 실험실이다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.tabs.items.at(-1)).toEqual({ key: "hypothesis", label: "가정 실험실" });
  });

  it("탭을 바꾸면 활성 탭이 바뀐다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.tabs.active).toBe("statistics");
    act(() => result.current.tabs.onChange("simulation"));
    expect(result.current.tabs.active).toBe("simulation");
  });

  it("내 번호·결과 확인은 탭이 아니라 번호 만들기 영역에 있다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.tabs.items.map((t) => t.key)).toEqual(["statistics", "simulation", "hypothesis"]);
  });

  it("resetStores 뒤에는 공통 상태가 처음 값이다", () => {
    getStore("state.home.combination").getState().choose([1, 2, 3, 4, 5, 6]);
    resetStores();
    expect(getStore("state.home.combination").getState().numbers).toBeNull();
  });
});
