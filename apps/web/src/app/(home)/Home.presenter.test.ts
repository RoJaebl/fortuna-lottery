import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { getStore, resetStores } from "@fortuna-lottery/store";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";
import { useHomePresenter } from "./Home.presenter";

function setup() {
  const container = createContainer("test");
  const wrapper = ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children });
  return { wrapper };
}

describe("useHomePresenter", () => {
  it("탭 목록 끝이 가정 실험실이다", () => {
    const { result } = renderHook(() => useHomePresenter(), { wrapper: setup().wrapper });
    expect(result.current.tabs.items.at(-1)).toEqual({ key: "hypothesis", label: "가정 실험실" });
  });

  it("탭을 바꾸면 활성 탭이 바뀐다", () => {
    const { result } = renderHook(() => useHomePresenter(), { wrapper: setup().wrapper });
    expect(result.current.tabs.active).toBe("statistics");
    act(() => result.current.tabs.onChange("results"));
    expect(result.current.tabs.active).toBe("results");
  });

  it("회차 카드가 공통 상태의 생성기 열림을 뒤집으면 페이지가 따라 펼친다", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useHomePresenter(), { wrapper });
    expect(result.current.isGeneratorOpen).toBe(false);
    act(() => getStore("state.home.generatorOpen").getState().toggle());
    expect(result.current.isGeneratorOpen).toBe(true);
  });

  it("resetStores 뒤에는 공통 상태가 처음 값이다", () => {
    getStore("state.home.combination").getState().choose([1, 2, 3, 4, 5, 6]);
    resetStores();
    expect(getStore("state.home.combination").getState().numbers).toBeNull();
  });
});
