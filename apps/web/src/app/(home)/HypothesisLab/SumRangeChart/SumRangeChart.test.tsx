import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SumRangeChart } from ".";

beforeAll(() => {
  // jsdom 에는 없다 — 차트는 폭이 바뀔 때만 쓴다
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
});

const chart = (min: number, max: number, onSelect = vi.fn()) => ({
  axis: { min: 21, max: 255 },
  bars: [],
  frequentBands: [],
  emptyBands: [],
  frequentLegend: null,
  emptyLegend: null,
  selected: { min, max },
  onSelect,
});

describe("SumRangeChart", () => {
  it("가로축 숫자는 차트 폭과 상관없이 text-pico 인 HTML 글이다", () => {
    render(<SumRangeChart {...chart(121, 160)} />);
    for (const n of ["21", "140", "255"]) {
      const label = screen.getByText(n);
      expect(label.tagName).toBe("SPAN");
      expect(label.closest(".text-pico")).not.toBeNull();
    }
  });

  it("키를 누르고 있으면 손잡이가 맡은 값에서 한 칸씩 곧바로 움직인다 — 미끄러지는 자리를 읽지 않는다", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<SumRangeChart {...chart(121, 160, onSelect)} />);
    const handle = screen.getByRole("slider", { name: "구간 손잡이 둘" });

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenLastCalledWith(121, 161);
    rerender(<SumRangeChart {...chart(121, 161, onSelect)} />);
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenLastCalledWith(121, 162);
    rerender(<SumRangeChart {...chart(121, 162, onSelect)} />);
    fireEvent.keyDown(handle, { key: "PageDown" });
    expect(onSelect).toHaveBeenLastCalledWith(121, 152);
  });
});
