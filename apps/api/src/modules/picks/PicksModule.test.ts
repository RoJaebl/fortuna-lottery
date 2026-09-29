import { Global, type INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp } from "../../configureApp.js";
import { CURRENT_USER } from "./domain/port/CurrentUserPort.js";
import { PicksFacade } from "./interface/facade/PicksFacade.js";
import { PicksModule } from "./PicksModule.js";

// 컨트롤러 시험 — interface/api 안에서는 모듈 파일을 import 할 수 없어(api-imports-no-module) 모듈 루트에 둔다.
// 시험하는 모듈만 띄운다 — 전체 조립(identity 연결)은 app.module.test 가 증명한다.
// 조립 루트가 꽂아 줄 CURRENT_USER 는 여기서 가짜를 전역으로 꽂는다
@Global()
@Module({
  providers: [{ provide: CURRENT_USER, useValue: { currentUser: async () => ({ id: "guest" }) } }],
  exports: [CURRENT_USER],
})
class FakeCurrentUserModule {}

async function boot(override?: Partial<PicksFacade>): Promise<{ app: INestApplication; base: string }> {
  let builder = Test.createTestingModule({ imports: [FakeCurrentUserModule, PicksModule] });
  if (override) builder = builder.overrideProvider(PicksFacade).useValue(override);
  const app = configureApp((await builder.compile()).createNestApplication());
  await app.listen(0);
  const { port } = app.getHttpServer().address() as { port: number };
  return { app, base: `http://127.0.0.1:${port}` };
}

const json = { "Content-Type": "application/json" };
const post = (base: string, body: string) =>
  fetch(`${base}/api/picks`, { method: "POST", headers: json, body });
const list = async (base: string) => (await (await fetch(`${base}/api/picks`)).json()) as { id: string }[];

describe("/api/picks", () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    ({ app, base } = await boot());
  });

  afterAll(async () => {
    await app.close();
  });

  it("저장 → 목록에 보임 → 삭제 → 목록에서 사라진다 — 저장소는 한 모듈 인스턴스에서 하나다", async () => {
    expect(await list(base)).toEqual([]);

    const saved = await post(base, JSON.stringify({ numbers: [45, 1, 22, 7, 33, 14] }));
    expect(saved.status).toBe(201);
    const pick = (await saved.json()) as { id: string; numbers: number[]; createdAt: string };
    expect(pick.numbers).toEqual([1, 7, 14, 22, 33, 45]);

    expect((await list(base)).map((p) => p.id)).toEqual([pick.id]);

    const removed = await fetch(`${base}/api/picks/${pick.id}`, { method: "DELETE" });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ deleted: true });

    expect(await list(base)).toEqual([]);
  });

  it("없는 픽을 지우면 404 { error } 이다", async () => {
    const res = await fetch(`${base}/api/picks/nope`, { method: "DELETE" });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "삭제할 픽을 찾을 수 없습니다" });
  });

  it("번호 7개는 400 { error } 이다", async () => {
    const res = await post(base, JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6, 7] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "잘못된 요청 형식입니다" });
  });

  it("46 이 섞인 조합은 400 { error } 이다", async () => {
    const res = await post(base, JSON.stringify({ numbers: [1, 2, 3, 4, 5, 46] }));

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

describe("GET /api/picks — 응답이 계약을 어기면", () => {
  it("서버 결함이므로 400 이 아니라 500 이다", async () => {
    const { app, base } = await boot({ list: async () => [{ id: "a", numbers: [1, 2, 3], createdAt: "x" }] });
    try {
      const res = await fetch(`${base}/api/picks`);

      expect(res.status).toBe(500);
    } finally {
      await app.close();
    }
  });
});
