import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";
import { useHomePresenter } from "./Home.presenter";

function setup() {
  const container = createContainer("test");
  const wrapper = ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children });
  return { container, wrapper };
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
    const { container, wrapper } = setup();
    const { result } = renderHook(() => useHomePresenter(), { wrapper });
    expect(result.current.isGeneratorOpen).toBe(false);
    act(() => container.resolve("state.home.generatorOpen").actions.toggle());
    expect(result.current.isGeneratorOpen).toBe(true);
  });

  it("컨테이너마다 공통 상태가 따로다", () => {
    const a = createContainer("test");
    a.resolve("state.home.combination").actions.choose([1, 2, 3, 4, 5, 6]);
    expect(createContainer("test").resolve("state.home.combination").get()).toBeNull();
  });
});
