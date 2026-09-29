import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../../../../app.module.js";
import { configureApp } from "../../../../configureApp.js";

describe("POST /api/generator", () => {
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

  const post = (body: unknown) =>
    fetch(`${base}/api/generator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("자동 생성은 200 과 번호 6개를 준다", async () => {
    const res = await post({ mode: "random" });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { numbers: number[] };
    expect(body.numbers).toHaveLength(6);
    expect(new Set(body.numbers).size).toBe(6);
  });

  it("스키마에 맞지 않는 요청은 400 이다", async () => {
    const res = await post({ fixedNumbers: "1,2,3" });

    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
  });

  it("번호 7개는 도메인 규칙이 거절해 400 이다 — 500 이 아니다", async () => {
    const res = await post({ fixedNumbers: [1, 2, 3, 4, 5, 6, 7] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "고정 번호는 최대 6개까지 가능합니다" });
  });

  it("중복 번호도 도메인 규칙이 거절해 400 이다", async () => {
    const res = await post({ fixedNumbers: [1, 1] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "고정 번호에 중복이 있습니다" });
  });
});
