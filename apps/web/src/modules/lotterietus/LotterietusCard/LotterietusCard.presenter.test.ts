import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatRemaining } from "./LotterietusCard.presenter";
import { useGetLotterietusStatusAction } from "./action/getLotterietusStatus.action";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

vi.mock("./action/getLotterietusStatus.action", () => ({ useGetLotterietusStatusAction: vi.fn() }));

describe("formatRemaining (카운트다운 presenter)", () => {
  it("일 단위가 있으면 D-표기", () => {
    const ms = ((3 * 86400 + 2 * 3600 + 4 * 60 + 5) * 1000);
    expect(formatRemaining(ms)).toBe("D-3 02:04:05");
  });

  it("하루 미만이면 시:분:초", () => {
    expect(formatRemaining(3661 * 1000)).toBe("01:01:01");
  });

  it("0 이하이면 추첨 시간", () => {
    expect(formatRemaining(0)).toBe("추첨 시간!");
    expect(formatRemaining(-100)).toBe("추첨 시간!");
  });
});

describe("useLotterietusCardPresenter", () => {
  it("불러오는 중이면 loading 이 참", () => {
    vi.mocked(useGetLotterietusStatusAction).mockReturnValue({ loading: true, error: null, status: null, retry: vi.fn() });
    const { result } = renderHook(() => useLotterietusCardPresenter());
    expect(result.current.loading).toBe(true);
    expect(result.current.remaining).toBeNull();
  });
});
