import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import type { PicksItem } from "@fortuna-lottery/contract/picks";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { CURRENT_USER, type CurrentUserPort } from "./domain/port/CurrentUserPort.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "./domain/port/DrawHistoryPort.js";
import { PICK_SOURCE, type PickSourcePort } from "./domain/port/PickSourcePort.js";
import { ResultsFacade } from "./interface/facade/ResultsFacade.js";
import { ResultsModule } from "./ResultsModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 시험하는 모듈만 띄운다 — DB 를 쓰지 않는다. 조립 루트가 꽂아 줄 세 포트는 여기서 가짜를 전역으로 꽂는다.
// picks 로 저장한 픽이 실제로 대조되는지는 조립 루트를 거치는 app.module.test 가 증명한다
const DRAWS: LotterietusDraw[] = [
  { round: 1, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2002-12-07T11:35:00.000Z" },
  { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2002-12-14T11:35:00.000Z" },
];
const PICKS: Record<string, PicksItem[]> = {
  guest: [
    { id: "old", numbers: [1, 2, 3, 4, 5, 7], createdAt: "2026-07-01T00:00:00.000Z" },
    { id: "new", numbers: [20, 21, 22, 23, 24, 25], createdAt: "2026-07-02T00:00:00.000Z" },
  ],
  other: [{ id: "x", numbers: [1, 2, 3, 4, 5, 6], createdAt: "2026-07-03T00:00:00.000Z" }],
};

@Global()
@Module({
  providers: [
    { provide: CURRENT_USER, useValue: { currentUser: async () => ({ id: "guest" }) } satisfies CurrentUserPort },
    { provide: PICK_SOURCE, useValue: { listByUser: async (id) => PICKS[id] ?? [] } satisfies PickSourcePort },
    { provide: DRAW_HISTORY, useValue: { findAll: async () => DRAWS } satisfies DrawHistoryPort },
  ],
  exports: [CURRENT_USER, PICK_SOURCE, DRAW_HISTORY],
})
class FakePortsModule {}

async function boot(override?: Partial<ResultsFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [FakePortsModule, ResultsModule] });
  if (override) builder = builder.overrideProvider(ResultsFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

describe("GET /api/results", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("현재 사용자의 픽만 최신 회차와 대조해 최신 저장순으로 200 을 준다", async () => {
    const res = await fetch(`${base}/api/results`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      draw: DRAWS[1],
      items: [
        { pickId: "new", numbers: [20, 21, 22, 23, 24, 25], matchedNumbers: [], matchedCount: 0, bonusMatched: false, rank: 0 },
        { pickId: "old", numbers: [1, 2, 3, 4, 5, 7], matchedNumbers: [1, 2, 3, 4, 5], matchedCount: 5, bonusMatched: true, rank: 2 },
      ],
    });
  });
});

describe("GET /api/results — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 500 이다", async () => {
    const { app, base } = await boot({ check: async () => ({ draw: null }) as never });
    try {
      const res = await fetch(`${base}/api/results`);

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
