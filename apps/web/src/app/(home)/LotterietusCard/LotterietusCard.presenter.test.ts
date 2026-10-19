import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ctaLabel, formatRemaining } from "./LotterietusCard.presenter";
import { LotterietusViewModel } from "./_model/Lotterietus.viewmodel";
import { useGetLotterietusStatusAction } from "./_action/getLotterietusStatus.action";
import { useLotterietusCardPresenter } from "./LotterietusCard.presenter";

vi.mock("./_action/getLotterietusStatus.action", () => ({ useGetLotterietusStatusAction: vi.fn() }));

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
    const { result } = renderHook(() => useLotterietusCardPresenter(false));
    expect(result.current.loading).toBe(true);
    expect(result.current.remaining).toBeNull();
  });

  it("앞선 회차가 있으면 다시 받는 중이어도 loading 은 거짓", () => {
    const status = Object.assign(new LotterietusViewModel(), {
      round: 1,
      drawnAt: new Date(2026, 0, 3),
      numbers: [1, 2, 3, 4, 5, 6],
      bonus: 7,
      nextRound: 2,
      nextDrawAt: new Date(Date.now() + 60_000),
    });
    vi.mocked(useGetLotterietusStatusAction).mockReturnValue({ loading: true, error: null, status, retry: vi.fn() });
    const { result } = renderHook(() => useLotterietusCardPresenter(false));
    expect(result.current.loading).toBe(false);
  });

  it("ctaLabel — 생성기가 열려 있는지에 따라", () => {
    vi.mocked(useGetLotterietusStatusAction).mockReturnValue({ loading: true, error: null, status: null, retry: vi.fn() });
    expect(renderHook(() => useLotterietusCardPresenter(true)).result.current.ctaLabel).toBe("생성기 닫기");
    expect(renderHook(() => useLotterietusCardPresenter(false)).result.current.ctaLabel).toBe("번호 생성하기");
  });
});

describe("ctaLabel", () => {
  it("열려 있으면 닫기, 아니면 생성하기", () => {
    expect(ctaLabel(true)).toBe("생성기 닫기");
    expect(ctaLabel(false)).toBe("번호 생성하기");
  });
});
