import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { LotterietusDraw } from "@fortuna-lottery/contract/lotterietus";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "./domain/port/DrawHistoryPort.js";
import { SimulationFacade } from "./interface/facade/SimulationFacade.js";
import { SimulationModule } from "./SimulationModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 시험하는 모듈만 띄운다 — DB 를 쓰지 않는다. 조립 루트가 꽂아 줄 DRAW_HISTORY 는 여기서 가짜를 전역으로 꽂는다
const DRAWS: LotterietusDraw[] = [
  { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2002-12-07T11:35:00.000Z" },
  { round: 2, numbers: [40, 41, 42, 43, 44, 45], bonus: 39, drawnAt: "2002-12-14T11:35:00.000Z" },
];

@Global()
@Module({
  providers: [{ provide: DRAW_HISTORY, useValue: { findAll: async () => DRAWS } satisfies DrawHistoryPort }],
  exports: [DRAW_HISTORY],
})
class FakeDrawHistoryModule {}

async function boot(override?: Partial<SimulationFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [FakeDrawHistoryModule, SimulationModule] });
  if (override) builder = builder.overrideProvider(SimulationFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

const post = (base: string, body: string) =>
  fetch(`${base}/api/simulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

describe("POST /api/simulation", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("주입된 전 회차에 대입한 결과를 200 으로 준다", async () => {
    const res = await post(base, JSON.stringify({ numbers: [6, 5, 4, 3, 2, 1] }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      totalDraws: 2,
      rankCounts: [1, 1, 0, 0, 0, 0],
      wins: [{ round: 1, rank: 1, matchedCount: 6 }],
    });
  });

  it("번호 7개는 400 { error } 이다", async () => {
    const res = await post(base, JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6, 7] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청 형식입니다" });
  });

  it("중복 번호는 도메인 규칙이 거절해 400 이다 — 500 이 아니다", async () => {
    const res = await post(base, JSON.stringify({ numbers: [1, 1, 2, 3, 4, 5] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "중복된 번호가 있습니다" });
  });

  it("JSON 이 깨진 본문도 옛 처리기와 같은 400 { error } 이다", async () => {
    const res = await post(base, "{ not json");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청 형식입니다" });
  });
});

describe("POST /api/simulation — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 400 이 아니라 500 이다", async () => {
    const { app, base } = await boot({ backtest: async () => ({ totalDraws: 1 }) as never });
    try {
      const res = await post(base, JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6] }));

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
