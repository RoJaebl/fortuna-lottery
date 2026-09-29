import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { LotterietusDrawSchema } from "@fortuna-lottery/contract/lotterietus";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { type ApiConfig, CONFIG } from "../../config.js";
import { configureApp } from "../../configureApp.js";
import { DummyDrawDataAdapter } from "./domain/adapter/DummyDrawDataAdapter.js";
import { CLOCK } from "./domain/port/ClockPort.js";
import { DRAW_DATA } from "./domain/port/DrawDataPort.js";
import { LotterietusFacade } from "./interface/facade/LotterietusFacade.js";
import { LotterietusModule } from "./LotterietusModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 실제 DB 를 쓰지 않는다 — 회차 데이터는 결정적 더미 어댑터가, 시각은 고정 시계가 준다.
// 조립 루트가 전역으로 내줄 CONFIG 는 여기서 가짜를 꽂는다 — 수집 스케줄러는 끈다(원격을 부르지 않는다)
@Global()
@Module({
  providers: [{ provide: CONFIG, useValue: { port: 0, schedulerEnabled: false } satisfies ApiConfig }],
  exports: [CONFIG],
})
class FakeConfigModule {}

async function boot(override?: Partial<LotterietusFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [FakeConfigModule, LotterietusModule] })
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

describe("LotterietusFacade.findAll — 다른 모듈이 받는 모양", () => {
  it("회차 오름차순의 계약 모양(LotterietusDraw[])이고, 번호는 원형과 떨어진 가변 배열이다", async () => {
    const { app } = await boot();
    try {
      const draws = await app.get(LotterietusFacade).findAll();

      expect(z.array(LotterietusDrawSchema).parse(draws)).toEqual(draws);
      expect(draws.map((d) => d.round)).toEqual([1, 2, 3]);
      expect(Object.isFrozen(draws[0]?.numbers)).toBe(false); // 더미 원형은 번호를 얼려 둔다 — 복사본이어야 한다
    } finally {
      await app.close();
    }
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
