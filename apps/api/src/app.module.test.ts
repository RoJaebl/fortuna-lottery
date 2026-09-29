import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { configureApp } from "./configureApp.js";

describe("AppModule", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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
});
