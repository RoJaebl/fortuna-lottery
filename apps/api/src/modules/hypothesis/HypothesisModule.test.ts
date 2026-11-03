import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "./domain/port/DrawHistoryPort.js";
import { HypothesisModule } from "./HypothesisModule.js";

// 시험하는 모듈만 띄운다 — DB 를 쓰지 않는다. DRAW_HISTORY 는 조립 루트 대신 가짜를 전역으로 꽂는다
const draw = (round: number, numbers: number[]): LotterietusDraw => ({
  round,
  numbers,
  bonus: 45,
  drawnAt: "2002-12-07T11:35:00.000Z",
});

// 회차 105 개 — 번호는 회차마다 한 칸씩 밀린 연속 6개
const DRAWS: LotterietusDraw[] = Array.from({ length: 105 }, (_, i) =>
  draw(i + 1, Array.from({ length: 6 }, (_, j) => ((i + j) % 40) + 1)),
);
// 모든 회차가 같은 조합 — K = 6 이고 과거 1등 제외면 남은 조합이 0 개다
const SAME: LotterietusDraw[] = Array.from({ length: 105 }, (_, i) => draw(i + 1, [1, 2, 3, 4, 5, 6]));

async function boot(draws: LotterietusDraw[]): Promise<{ app: INestApplication; base: string }> {
  @Global()
  @Module({
    providers: [{ provide: DRAW_HISTORY, useValue: { findAll: async () => draws } satisfies DrawHistoryPort }],
    exports: [DRAW_HISTORY],
  })
  class FakeDrawHistoryModule {}

  const app = configureApp(
    (await Test.createTestingModule({ imports: [FakeDrawHistoryModule, HypothesisModule] }).compile()).createNestApplication(),
  );
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

// 합계 구간 전체 — 합 조건이 아무것도 거르지 않는다
const ALL = { min: 21, max: 255 };

const post = (base: string, path: string, body: unknown) =>
  fetch(`${base}/api/hypothesis/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/hypothesis/*", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot(DRAWS));
  });
  afterAll(async () => {
    await app.close();
  });

  it("evaluate 는 가정 우주·풀·적중률·백테스트를 200 으로 준다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: false, topK: 20 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalCombinations).toBe(8_145_060);
    expect(body.assumedCombinations).toBe(38_760);
    expect(body.pool).toHaveLength(20);
    expect(body.hitRate.rounds).toBe(5);
    expect(body.backtest.random.tickets).toBe(100);
  });

  it("evaluate 는 excludePastWinners 가 없으면 400 이다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, topK: 20 });

    expect(res.status).toBe(400);
  });

  it("generate 는 풀 안의 번호 6개를 200 으로 준다", async () => {
    const assumption = { sumRange: ALL, excludePastWinners: true, topK: 10 };
    const { pool } = await (await post(base, "evaluate", assumption)).json();
    const res = await post(base, "generate", assumption);
    const { numbers } = await res.json();

    expect(res.status).toBe(200);
    expect(numbers).toHaveLength(6);
    for (const n of numbers) expect(pool).toContain(n);
  });

  it("evaluate 는 합계 구간의 숫자를 모두 싣는다", async () => {
    const res = await post(base, "evaluate", { sumRange: { min: 100, max: 160 }, excludePastWinners: false });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sumRange).toEqual({ min: 100, max: 160 });
    expect(body.sumCounts).toHaveLength(235);
    expect(body.numbers).toHaveLength(45);
    expect(body.theoryRate * 8_145_060).toBe(body.assumedCombinations);
    expect(body.denominators.theory).toBe(8_145_060);
    expect(body.hitRate.rounds).toBe(105);
    expect(body.pastRate).toBe(body.hitRate.hits / 105);
  });

  it("evaluate 는 untilRound 까지만 센다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: false, untilRound: 1 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hitRate.rounds).toBe(1);
  });

  it("센 회차가 없으면 과거 비율 0, 과거 분모 null 이다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: false, topK: 10, untilRound: 1 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hitRate.rounds).toBe(0);
    expect(body.pastRate).toBe(0);
    expect(body.denominators.past).toBeNull();
    expect(body.sumCounts.every((c: number) => c === 0)).toBe(true);
    expect(body.frequentBands).toEqual([]);
    expect(body.maxWindowRate).toBe(0);
  });

  it("K 를 켜면 차트도 센 회차만 센다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: false, topK: 10 });
    const body = await res.json();

    expect(body.hitRate.rounds).toBe(5);
    expect(body.sumCounts.reduce((a: number, b: number) => a + b, 0)).toBe(body.hitRate.rounds);
  });

  it("evaluate·generate 는 최소가 최대보다 큰 구간을 400 으로 거절한다", async () => {
    for (const path of ["evaluate", "generate"]) {
      const res = await post(base, path, { sumRange: { min: 200, max: 100 }, excludePastWinners: false });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "합계 구간의 최소가 최대보다 큽니다" });
    }
  });

  it("evaluate 는 고른 번호만으로 구간을 넘으면 400 이다", async () => {
    const res = await post(base, "evaluate", {
      sumRange: { min: 21, max: 30 },
      excludePastWinners: false,
      fixed: [40],
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "이 가정 아래 남은 조합이 없습니다" });
  });

  it("evaluate·generate 는 풀 밖의 고른 번호를 400 으로 거절한다", async () => {
    const assumption = { sumRange: ALL, excludePastWinners: false, topK: 6 };
    const { pool } = await (await post(base, "evaluate", assumption)).json();
    const outside = [...Array(45).keys()].map((i) => i + 1).find((n) => !pool.includes(n));
    for (const path of ["evaluate", "generate"]) {
      const res = await post(base, path, { ...assumption, fixed: [outside] });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "고른 번호 가운데 풀 밖의 번호가 있습니다" });
    }
  });

  it("evaluate 는 고른 번호 중복을 400 으로 거절한다", async () => {
    const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: false, fixed: [3, 3] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "고정 번호에 중복이 있습니다" });
  });

  it("popularity 는 중복 번호를 400 으로 거절한다", async () => {
    const res = await post(base, "popularity", { numbers: [1, 1, 2, 3, 4, 5] });

    expect(res.status).toBe(400);
  });

  it("popularity 는 걸리는 패턴을 200 으로 준다", async () => {
    const res = await post(base, "popularity", { numbers: [1, 2, 3, 10, 20, 30] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ patterns: ["birthday", "consecutive"] });
  });
});

describe("남은 조합이 0 개인 가정", () => {
  it("evaluate 는 제외만으로 우주가 비어도 200 이고 이론 비율 0, 과거 분모 null 이다", async () => {
    const { app, base } = await boot(SAME);
    try {
      const res = await post(base, "evaluate", { sumRange: ALL, excludePastWinners: true, topK: 6 });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.assumedCombinations).toBe(0);
      expect(body.theoryRate).toBe(0);
      expect(body.denominators.past).toBeNull();
    } finally {
      await app.close();
    }
  });

  it("generate 는 다시 뽑지 않고 400 으로 거절한다", async () => {
    const { app, base } = await boot(SAME);
    try {
      const res = await post(base, "generate", { sumRange: ALL, excludePastWinners: true, topK: 6 });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "이 가정 아래 남은 조합이 없습니다" });
    } finally {
      await app.close();
    }
  });
});
