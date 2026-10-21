import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { saveButtonLabel } from "./PicksCard.presenter";
import { useDeletePickAction } from "./_action/deletePick.action";
import { useListPicksAction } from "./_action/listPicks.action";
import { useSavePickAction } from "./_action/savePick.action";
import { usePicksCardPresenter } from "./PicksCard.presenter";

import { createElement, type ReactNode } from "react";
import { StoreProvider } from "@framework/react";
import { createContainer } from "@composition/createContainer";

vi.mock("./_action/listPicks.action", async (importOriginal) => ({ ...(await importOriginal<object>()), useListPicksAction: vi.fn() }));
vi.mock("./_action/savePick.action", async (importOriginal) => ({ ...(await importOriginal<object>()), useSavePickAction: vi.fn() }));
vi.mock("./_action/deletePick.action", async (importOriginal) => ({ ...(await importOriginal<object>()), useDeletePickAction: vi.fn() }));

/** presenter 가 공통 상태를 꺼내므로 공급자 안에서 그린다 — 조합과 생성기 열림을 미리 정한다 */
function withState(numbers: number[] | null = null, generatorOpen = false) {
  const container = createContainer("test");
  if (numbers) container.resolve("state.home.combination").actions.choose(numbers);
  if (generatorOpen) container.resolve("state.home.generatorOpen").actions.toggle();
  return { wrapper: ({ children }: { children: ReactNode }) => createElement(StoreProvider, { container, children }) };
}

describe("PicksCard 표시 조정자", () => {
  it("saveButtonLabel — 저장 중 · 저장 가능 · 조합 없음 순으로 문구를 고른다", () => {
    expect(saveButtonLabel(true, true)).toBe("저장 중…");
    expect(saveButtonLabel(false, true)).toBe("현재 번호 저장");
    expect(saveButtonLabel(false, false)).toBe("먼저 번호를 생성하세요");
  });
});

describe("usePicksCardPresenter", () => {
  it("불러오는 중이면 loading 이 참", () => {
    vi.mocked(useListPicksAction).mockReturnValue({ loading: true, error: null, picks: [], retry: vi.fn() });
    vi.mocked(useSavePickAction).mockReturnValue({ pending: false, error: null, run: vi.fn(), clearError: vi.fn() } as never);
    vi.mocked(useDeletePickAction).mockReturnValue({ pending: false, error: null, run: vi.fn(), clearError: vi.fn() } as never);
    const { result } = renderHook(() => usePicksCardPresenter(), withState());
    expect(result.current.loading).toBe(true);
    expect(result.current.empty).toBe(false);
  });
});
