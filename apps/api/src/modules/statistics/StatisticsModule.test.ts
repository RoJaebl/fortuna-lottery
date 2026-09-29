import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "./domain/port/DrawHistoryPort.js";
import { StatisticsFacade } from "./interface/facade/StatisticsFacade.js";
import { StatisticsModule } from "./StatisticsModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 시험하는 모듈만 띄운다 — DB 를 쓰지 않는다. 조립 루트가 꽂아 줄 DRAW_HISTORY 는 여기서 가짜를 전역으로 꽂는다
const DRAWS: LotterietusDraw[] = [
  { round: 1, numbers: [1, 2, 3, 11, 23, 41], bonus: 45, drawnAt: "2002-12-07T11:35:00.000Z" },
  { round: 2, numbers: [1, 2, 13, 24, 35, 44], bonus: 45, drawnAt: "2002-12-14T11:35:00.000Z" },
];

@Global()
@Module({
  providers: [{ provide: DRAW_HISTORY, useValue: { findAll: async () => DRAWS } satisfies DrawHistoryPort }],
  exports: [DRAW_HISTORY],
})
class FakeDrawHistoryModule {}

async function boot(override?: Partial<StatisticsFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [FakeDrawHistoryModule, StatisticsModule] });
  if (override) builder = builder.overrideProvider(StatisticsFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

describe("GET /api/statistics", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("주입된 회차로 계산한 통계와 고정 분모를 200 으로 준다", async () => {
    const res = await fetch(`${base}/api/statistics`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown> & { frequency: number[] };
    expect(body).toMatchObject({
      totalDraws: 2,
      latestRound: 2,
      totalCombinations: 8_145_060,
      sumDistribution: [
        { sum: 81, count: 1 },
        { sum: 119, count: 1 },
      ],
      recentGrid: DRAWS.map((d) => ({ round: d.round, numbers: d.numbers })),
      topPairs: expect.arrayContaining([{ a: 1, b: 2, count: 2 }]),
    });
    expect(body.frequency).toHaveLength(45);
  });
});

describe("GET /api/statistics — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 500 이다", async () => {
    const { app, base } = await boot({ get: async () => ({ totalDraws: 1 }) as never });
    try {
      const res = await fetch(`${base}/api/statistics`);

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
