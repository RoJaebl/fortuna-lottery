import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHomePresenter } from "./Home.presenter";

describe("useHomePresenter (셸 — 모듈 간 공유 상태)", () => {
  it("생성기가 번호를 올리면 통계·시뮬레이션·내 번호에 같은 배열이 들어간다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.statistics.myNumbers).toBeNull();

    const numbers = [1, 2, 3, 4, 5, 6];
    act(() => result.current.generator.onGenerated(numbers));

    expect(result.current.statistics.myNumbers).toBe(numbers);
    expect(result.current.simulation.numbers).toBe(numbers);
    expect(result.current.picks.currentNumbers).toBe(numbers);
  });

  it("가정 실험실이 번호를 같이 받고, 뽑은 번호를 셸에 올린다", () => {
    const { result } = renderHook(() => useHomePresenter());
    const numbers = [1, 2, 3, 4, 5, 6];
    act(() => result.current.generator.onGenerated(numbers));
    expect(result.current.hypothesis.numbers).toBe(numbers);

    const drawn = [7, 8, 9, 10, 11, 12];
    act(() => result.current.hypothesis.onGenerated(drawn));
    expect(result.current.statistics.myNumbers).toBe(drawn);
  });

  it("탭 목록 끝이 가정 실험실이다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.tabs.items.at(-1)).toEqual({ key: "hypothesis", label: "가정 실험실" });
  });

  it("onToggleGenerator 가 생성기 열림을 뒤집는다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.lotterietus.generatorOpen).toBe(false);
    expect(result.current.isGeneratorOpen).toBe(false);

    act(() => result.current.lotterietus.onToggleGenerator());
    expect(result.current.lotterietus.generatorOpen).toBe(true);
    expect(result.current.isGeneratorOpen).toBe(true);

    act(() => result.current.lotterietus.onToggleGenerator());
    expect(result.current.isGeneratorOpen).toBe(false);
  });

  it("탭을 바꾸면 활성 탭이 바뀐다", () => {
    const { result } = renderHook(() => useHomePresenter());
    expect(result.current.tabs.active).toBe("statistics");
    act(() => result.current.tabs.onChange("results"));
    expect(result.current.tabs.active).toBe("results");
  });
});
