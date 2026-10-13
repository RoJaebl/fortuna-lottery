import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { saveButtonLabel } from "./PicksCard.presenter";
import { useDeletePickAction } from "./action/deletePick.action";
import { useListPicksAction } from "./action/listPicks.action";
import { useSavePickAction } from "./action/savePick.action";
import { usePicksCardPresenter } from "./PicksCard.presenter";

vi.mock("./action/listPicks.action", () => ({ useListPicksAction: vi.fn() }));
vi.mock("./action/savePick.action", () => ({ useSavePickAction: vi.fn() }));
vi.mock("./action/deletePick.action", () => ({ useDeletePickAction: vi.fn() }));

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
    const { result } = renderHook(() => usePicksCardPresenter(null));
    expect(result.current.loading).toBe(true);
    expect(result.current.empty).toBe(false);
  });
});
