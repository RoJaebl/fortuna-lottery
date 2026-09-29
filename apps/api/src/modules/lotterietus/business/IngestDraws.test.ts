import { describe, expect, it, vi } from "vitest";
import type { Draw } from "../domain/model/Draw.model.js";
import type { DrawSourcePort } from "../domain/port/DrawSourcePort.js";
import type { DrawWriterPort } from "../domain/port/DrawWriterPort.js";
import { IngestDraws } from "./IngestDraws.js";

const makeDraw = (round: number): Draw => ({
  round,
  numbers: [1, 2, 3, 4, 5, 6],
  bonus: 7,
  drawnAt: "2026-08-01T11:35:00.000Z",
});

/**
 * 동행복권 실동작 Fake — 요청 회차 R에 대해 [R-5, R+4] 창을 내림차순으로 반환하고,
 * 양 끝에서는 창을 밀어 항상 10개를 채운다. R이 아직 없는 회차면 빈 배열.
 * (2026-08-02 실측 동작)
 */
const fakeSource = (latest: number) => {
  const calls: number[] = [];
  const port: DrawSourcePort = {
    fetchBatch: async (centerRound) => {
      calls.push(centerRound);
      if (centerRound > latest || centerRound < 1) return [];
      const end = Math.min(centerRound + 4, latest);
      const start = Math.max(1, end - 9);
      const windowEnd = Math.min(latest, start + 9);
      const rows: Draw[] = [];
      for (let round = windowEnd; round >= start; round -= 1) rows.push(makeDraw(round));
      return rows;
    },
  };
  return { port, calls };
};

/** 창이 [R, R+9](위쪽으로만)인 가상의 원격 — 원격 동작이 바뀌어도 구멍이 없는지 검증용 */
const forwardWindowSource = (latest: number) => {
  const calls: number[] = [];
  const port: DrawSourcePort = {
    fetchBatch: async (centerRound) => {
      calls.push(centerRound);
      if (centerRound > latest || centerRound < 1) return [];
      const rows: Draw[] = [];
      for (let round = centerRound; round <= Math.min(centerRound + 9, latest); round += 1) {
        rows.push(makeDraw(round));
      }
      return rows;
    },
  };
  return { port, calls };
};

const fakeWriter = (initialMax = 0) => {
  const saved: number[] = [];
  let max = initialMax;
  const port: DrawWriterPort = {
    getMaxRound: async () => max,
    upsertDraws: async (draws) => {
      for (const draw of draws) saved.push(draw.round);
      max = Math.max(max, ...draws.map((draw) => draw.round));
    },
  };
  return { port, saved };
};

const noSleep = async () => {};

describe("ingestDraws (수집 catch-up 사이클)", () => {
  it("빈 DB에서 1회차부터 최신 회차까지 빠짐없이 저장한다", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(0);
    const ingest = new IngestDraws(source.port, writer.port, { sleep: noSleep });

    const result = await ingest.execute();

    expect(writer.saved).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.startRound).toBe(0);
    expect(result.latestRound).toBe(12);
    expect(result.ingestedCount).toBe(12);
  });

  it("이미 저장된 회차 다음부터 이어서 수집한다 (중단 후 재개)", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(10);
    const ingest = new IngestDraws(source.port, writer.port, { sleep: noSleep });

    const result = await ingest.execute();

    expect(writer.saved).toEqual([11, 12]);
    expect(result.startRound).toBe(10);
    expect(result.latestRound).toBe(12);
  });

  it("이미 최신이면 아무것도 저장하지 않고 점프 폭을 줄이다 종료한다", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(12);
    const ingest = new IngestDraws(source.port, writer.port, { sleep: noSleep });

    const result = await ingest.execute();

    expect(writer.saved).toEqual([]);
    expect(result.ingestedCount).toBe(0);
    // 6 → 3 → 1로 좁히며 "다음 회차 없음"을 확정한다
    expect(source.calls).toEqual([18, 15, 13]);
  });

  it("배치에 성공하면 점프 폭이 다시 최대로 리셋된다", async () => {
    const source = fakeSource(30);
    const writer = fakeWriter(0);
    const ingest = new IngestDraws(source.port, writer.port, { sleep: noSleep });

    await ingest.execute();

    // 매번 10회차씩 전진 — 성공 후 폭이 줄어든 채로 남지 않는다
    expect(source.calls.slice(0, 3)).toEqual([6, 16, 26]);
  });

  it("요청 사이마다 지정한 지연만큼 대기한다 (종료 직전에는 대기하지 않음)", async () => {
    const sleep = vi.fn(async () => {});
    const source = fakeSource(12);
    const writer = fakeWriter(12);
    const ingest = new IngestDraws(source.port, writer.port, {
      sleep,
      requestDelayMs: 1500,
    });

    await ingest.execute();

    expect(source.calls).toHaveLength(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1500);
  });

  it("응답 창이 저장분과 이어지지 않으면 저장하지 않고 폭을 줄인다 (구멍 방지)", async () => {
    // 원격이 [R, R+9] 창으로 바뀐 상황 — 순진하게 저장하면 앞쪽 회차가 통째로 빈다
    const source = forwardWindowSource(20);
    const writer = fakeWriter(0);
    const ingest = new IngestDraws(source.port, writer.port, { sleep: noSleep });

    const result = await ingest.execute();

    expect(writer.saved).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(result.latestRound).toBe(20);
  });

  it("응답이 있어도 저장분과 계속 이어지지 않으면 경고 로그 후 종료한다 (무한루프 방지)", async () => {
    const calls: number[] = [];
    const source: DrawSourcePort = {
      fetchBatch: async (centerRound) => {
        calls.push(centerRound);
        return [makeDraw(centerRound + 5)]; // 항상 비어있지 않지만 저장분과 절대 안 이어짐
      },
    };
    const writer = fakeWriter(0);
    const logger = vi.fn();
    const ingest = new IngestDraws(source, writer.port, { sleep: noSleep, logger });

    const result = await ingest.execute();

    expect(writer.saved).toEqual([]);
    expect(result.ingestedCount).toBe(0);
    expect(calls).toEqual([6, 3, 1]);
    expect(logger).toHaveBeenCalledWith(expect.stringContaining("경고"));
  });
});
