import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { DummyDrawDataAdapter } from "./domain/adapter/DummyDrawDataAdapter.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { DRAW_DATA } from "./domain/port/DrawDataPort.js";
import { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";
import { LotterietusModule } from "./LotterietusModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 실제 DB 를 쓰지 않는다 — 회차 데이터는 결정적 더미 어댑터가, 시각은 고정 시계가 준다
async function boot(override?: Partial<LotterietusFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [LotterietusModule] })
    .overrideProvider(DRAW_DATA)
    .useValue(new DummyDrawDataAdapter({ rounds: 3 }))
    .overrideProvider(CLOCK)
    .useValue(() => new Date("2026-07-01T00:00:00.000Z"));
  if (override) builder = builder.overrideProvider(LotterietusFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

describe("GET /api/lotterietus", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("최근 회차와 다음 추첨 정보를 200 으로 준다", async () => {
    const res = await fetch(`${base}/api/lotterietus`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      round: 3,
      bonus: expect.any(Number),
      drawnAt: "2002-12-21T11:35:00.000Z",
      nextRound: 4,
      nextDrawAt: "2026-07-04T11:35:00.000Z",
    });
    expect(body.numbers).toHaveLength(6);
  });
});

describe("GET /api/lotterietus — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 500 이다", async () => {
    const { app, base } = await boot({ status: async () => ({ round: 1 }) as never });
    try {
      const res = await fetch(`${base}/api/lotterietus`);

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
