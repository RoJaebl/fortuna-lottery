import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStore } from "supa-store";

const range = () => getStore("state.home.labRange").getState();

describe("state.home.labRange", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("처음 구간은 121~160 이고 보낸 구간도 같다", () => {
    expect(range()).toMatchObject({ min: 121, max: 160, committed: { min: 121, max: 160 } });
  });

  it("setRange 는 두 값을 정렬하고 21~255 로 묶는다", () => {
    range().setRange(200, 100);
    expect(range()).toMatchObject({ min: 100, max: 200 });
    range().setRange(300, 0);
    expect(range()).toMatchObject({ min: 21, max: 255 });
  });

  it("숫자가 아닌 값은 버린다", () => {
    range().setRange(Number.NaN, 150);
    expect(range()).toMatchObject({ min: 121, max: 160 });
  });

  it("setRangeNow 는 기다리지 않고 보낸 구간까지 바꾸며, 앞서 걸린 setRange 를 지운다", () => {
    range().setRange(100, 110);
    range().setRangeNow(130, 90);
    expect(range()).toMatchObject({ min: 90, max: 130, committed: { min: 90, max: 130 } });
    vi.advanceTimersByTime(300);
    expect(range().committed).toEqual({ min: 90, max: 130 });
  });

  it("보낸 구간은 마지막 setRange 뒤 300ms 에 한 번 따라온다", () => {
    range().setRange(100, 110);
    vi.advanceTimersByTime(200);
    range().setRange(100, 120);
    vi.advanceTimersByTime(299);
    expect(range().committed).toEqual({ min: 121, max: 160 });
    vi.advanceTimersByTime(1);
    expect(range().committed).toEqual({ min: 100, max: 120 });
  });
});
