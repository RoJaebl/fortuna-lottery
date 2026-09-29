import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configureApp.js";
import type { Draw } from "./modules/lotterietus/domain/model/Draw.model.js";
import { DRAW_DATA, type DrawDataPort } from "./modules/lotterietus/domain/port/DrawDataPort.js";

const DRAWS: Draw[] = [
  { round: 1, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2002-12-07T11:35:00.000Z" },
  { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2002-12-14T11:35:00.000Z" },
];

describe("AppModule", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    // DB 를 쓰지 않는다 — lotterietus 의 회차 읽기 어댑터만 가짜로 바꾸고 나머지 조립은 실제 그대로다
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DRAW_DATA)
      .useValue({ getAllDraws: async () => DRAWS } satisfies DrawDataPort)
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.listen(0);
    const { port } = app.getHttpServer().address() as { port: number };
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health 는 200 { ok: true } 를 준다", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("조립 루트가 identity 를 picks 의 CURRENT_USER 에 꽂아, 게스트의 픽이 저장되고 보인다", async () => {
    const saved = await fetch(`${base}/api/picks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6] }),
    });
    expect(saved.status).toBe(201);

    const list = (await (await fetch(`${base}/api/picks`)).json()) as { numbers: number[] }[];
    expect(list.map((p) => p.numbers)).toEqual([[1, 2, 3, 4, 5, 6]]);
  });

  it("조립 루트가 picks 를 results 의 PICK_SOURCE 에 꽂아, picks 로 저장한 픽이 결과 확인에 나온다", async () => {
    const saved = await fetch(`${base}/api/picks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numbers: [45, 1, 2, 3, 40, 41] }),
    });
    expect(saved.status).toBe(201);
    const pick = (await saved.json()) as { id: string };

    const res = await fetch(`${base}/api/results`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { draw: { round: number } | null; items: { pickId: string; rank: number; matchedNumbers: number[] }[] };
    expect(body.draw?.round).toBe(2);
    expect(body.items.find((item) => item.pickId === pick.id)).toMatchObject({ matchedNumbers: [1, 2, 3], rank: 5 });
  });
});
