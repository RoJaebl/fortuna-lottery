import { Logger } from "@nestjs/common";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiConfig } from "../../config.js";
import type { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";
import { LotterietusIngestScheduler } from "./interface/api/LotterietusIngestScheduler.js";

// 스케줄러는 interface/api 에 살지만, 그 안에서는 같은 폴더 파일도 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 가짜 시계로 「성공하면 다음 추첨 + 10분, 실패하면 5분 뒤」와 「종료하면 대기 타이머가 남지 않는다」를 묶는다(Review Focus 5)

const MINUTE = 60 * 1000;
// 2026-07-01 은 수요일 — 다음 추첨은 2026-07-04T11:35Z, 그 10분 뒤가 다음 사이클이다
const NOW = new Date("2026-07-01T00:00:00.000Z");
const UNTIL_NEXT_DRAW_PLUS_BUFFER = new Date("2026-07-04T11:45:00.000Z").getTime() - NOW.getTime();

const result = { startRound: 1, latestRound: 1, ingestedCount: 0, requestCount: 1 };
const enabled: ApiConfig = { port: 0, schedulerEnabled: true };

function setup(ingest: () => Promise<typeof result>, config: ApiConfig = enabled) {
  const facade = { ingest: vi.fn(ingest), nextDrawAt: () => new Date("2026-07-04T11:35:00.000Z") };
  const scheduler = new LotterietusIngestScheduler(facade as unknown as LotterietusFacade, config);
  return { facade, scheduler };
}

describe("LotterietusIngestScheduler", () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("기동하면 곧바로 한 사이클을 돌고, 성공하면 다음 추첨 + 10분 뒤에 다시 돈다", async () => {
    const { facade, scheduler } = setup(async () => result);

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(0);
    expect(facade.ingest).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(UNTIL_NEXT_DRAW_PLUS_BUFFER - 1);
    expect(facade.ingest).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(facade.ingest).toHaveBeenCalledTimes(2);

    scheduler.onModuleDestroy();
  });

  it("사이클이 실패하면 5분 뒤에 다시 돈다", async () => {
    const { facade, scheduler } = setup(async () => {
      throw new Error("원격 응답 없음");
    });

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(0);
    expect(facade.ingest).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5 * MINUTE - 1);
    expect(facade.ingest).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(facade.ingest).toHaveBeenCalledTimes(2);

    scheduler.onModuleDestroy();
  });

  it("종료하면 대기 타이머가 남지 않는다", async () => {
    const { scheduler } = setup(async () => result);

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(1);

    scheduler.onModuleDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("사이클 도중에 종료되면 끝난 뒤에도 다음 타이머를 걸지 않는다", async () => {
    let finish: (value: typeof result) => void = () => {};
    const { scheduler } = setup(() => new Promise((resolve) => (finish = resolve)));

    scheduler.onApplicationBootstrap();
    scheduler.onModuleDestroy();
    finish(result);
    await vi.advanceTimersByTimeAsync(0);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("SCHEDULER_ENABLED=false 면 시작하지 않는다", async () => {
    const { facade, scheduler } = setup(async () => result, { port: 0, schedulerEnabled: false });

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(UNTIL_NEXT_DRAW_PLUS_BUFFER);

    expect(facade.ingest).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
