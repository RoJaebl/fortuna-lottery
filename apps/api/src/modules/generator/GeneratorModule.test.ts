import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { GeneratorModule } from "./GeneratorModule.js";
import { GeneratorFacade } from "./interface/facade/GeneratorFacade.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 시험하는 모듈만 띄운다 — 전체 조립은 app.module.test 가 증명한다
async function boot(override?: Partial<GeneratorFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [GeneratorModule] });
  if (override) builder = builder.overrideProvider(GeneratorFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

const post = (base: string, body: string) =>
  fetch(`${base}/api/generator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

describe("POST /api/generator", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("자동 생성은 200 과 번호 6개를 준다", async () => {
    const res = await post(base, JSON.stringify({ mode: "random" }));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { numbers: number[] };
    expect(body.numbers).toHaveLength(6);
    expect(new Set(body.numbers).size).toBe(6);
  });

  it("스키마에 맞지 않는 요청은 400 { error } 이다", async () => {
    const res = await post(base, JSON.stringify({ fixedNumbers: "1,2,3" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청 형식입니다" });
  });

  it("JSON 이 깨진 본문도 옛 처리기와 같은 400 { error } 이다", async () => {
    const res = await post(base, "{ not json");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청 형식입니다" });
  });

  it("번호 7개는 도메인 규칙이 거절해 400 이다 — 500 이 아니다", async () => {
    const res = await post(base, JSON.stringify({ fixedNumbers: [1, 2, 3, 4, 5, 6, 7] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "고정 번호는 최대 6개까지 가능합니다" });
  });

  it("중복 번호도 도메인 규칙이 거절해 400 이다", async () => {
    const res = await post(base, JSON.stringify({ fixedNumbers: [1, 1] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "고정 번호에 중복이 있습니다" });
  });
});

describe("POST /api/generator — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 400 이 아니라 500 이다", async () => {
    const { app, base } = await boot({ generate: async () => ({ numbers: [1, 2, 3] }) });
    try {
      const res = await post(base, JSON.stringify({}));

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
