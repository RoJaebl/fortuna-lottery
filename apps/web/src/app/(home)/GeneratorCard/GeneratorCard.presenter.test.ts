import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGenerateCombinationAction } from "./_action/generateCombination.action";
import { canGenerate, modeHint, useGeneratorCardPresenter } from "./GeneratorCard.presenter";

import { createElement, type ReactNode } from "react";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";

vi.mock("./_action/generateCombination.action", async (importOriginal) => ({ ...(await importOriginal<object>()), useGenerateCombinationAction: vi.fn() }));

/** presenter 가 공통 상태를 꺼내므로 공급자 안에서 그린다 — 조합과 생성기 열림을 미리 정한다 */
function withState(numbers: number[] | null = null, generatorOpen = false) {
  const container = createContainer("test");
  if (numbers) container.resolve("state.home.combination").actions.choose(numbers);
  if (generatorOpen) container.resolve("state.home.generatorOpen").actions.toggle();
  return { wrapper: ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children }) };
}

const mockAction = (pending = false) =>
  vi.mocked(useGenerateCombinationAction).mockReturnValue({
    run: vi.fn(),
    result: null,
    pending,
    error: null,
    clearError: vi.fn(),
  });

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
    mockAction();
    const { result } = renderHook(() => useGeneratorCardPresenter(), withState());
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
    mockAction();
    const { result } = renderHook(() => useGeneratorCardPresenter(), withState());
    expect(result.current.generateDisabled).toBe(false);
    expect(result.current.generateLabel).toBe("번호 생성");
    act(() => result.current.changeMode("manual"));
    expect(result.current.generateDisabled).toBe(true);

    mockAction(true);
    const busy = renderHook(() => useGeneratorCardPresenter(), withState()).result.current;
    expect(busy.generateDisabled).toBe(true);
    expect(busy.generateLabel).toBe("생성 중…");
  });
});
