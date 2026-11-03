import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PLAY_SPEEDS, RoundTimeline } from ".";

/** 통계 탭과 실험실이 같은 부품을 쓰므로, 여기서 정한 재생 속도가 두 화면의 속도다 */
function play(speed: number) {
  const onSeek = vi.fn();
  render(
    <RoundTimeline
      position={0}
      minPosition={0}
      total={1245}
      roundAt={(i) => i + 1}
      onSeek={onSeek}
      page={100}
      label="회차"
      valueText="제1회"
      speed={speed}
      speeds={PLAY_SPEEDS}
      onSpeedChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "재생" }));
  return onSeek;
}

describe("RoundTimeline 재생", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    [1, 10],
    [10, 100],
  ])("%d 배속은 1 초에 %d 회차를 넘긴다 — 벽시계로 세므로 프레임이 무거워도 늦어지지 않는다", (speed, rounds) => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const onSeek = play(speed);
    act(() => vi.advanceTimersByTime(1000));
    const last = onSeek.mock.calls.at(-1)![0] as number;
    expect(Math.abs(last - rounds)).toBeLessThanOrEqual(1);
  });

  it("다시 누르면 멈춘다", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const onSeek = play(1);
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    const count = onSeek.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(onSeek.mock.calls.length).toBe(count);
  });
});
