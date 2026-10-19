import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchHttpClient } from "./fetchHttpClient";
import { TestHttpClient } from "./testHttpClient";

afterEach(() => vi.unstubAllGlobals());

describe("FetchHttpClient", () => {
  const client = new FetchHttpClient();

  it("성공하면 본문을 그대로 돌려준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ numbers: [1] })));
    await expect(client.get("/api/x")).resolves.toEqual({ numbers: [1] });
  });

  it("실패 응답의 본문 error 를 오류 문구로 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "이미 같은 번호가 있습니다" }, { status: 409 })));
    await expect(client.get("/api/x")).rejects.toThrow("이미 같은 번호가 있습니다");
  });

  it("본문이 JSON 이 아니면 상태 코드로 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 502 })));
    await expect(client.get("/api/x")).rejects.toThrow("요청 실패 (502)");
  });

  it("본문에 error 가 없으면 요청 실패 (500) 을 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({}, { status: 500 })));
    await expect(client.get("/api/x")).rejects.toThrow("요청 실패 (500)");
  });

  it("204 이면 undefined 를 돌려준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(client.send("/api/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("성공인데 본문이 비어 있으면 undefined 를 돌려준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })));
    await expect(client.get("/api/x")).resolves.toBeUndefined();
  });
});

describe("TestHttpClient", () => {
  it("응답을 정하지 않은 경로는 실패하고, 보낸 요청은 sent 에 쌓인다", async () => {
    const http = new TestHttpClient();
    await expect(http.get("/api/x")).rejects.toThrow("시험이 응답을 정하지 않은 경로다: /api/x");
    expect(http.sent).toEqual([{ path: "/api/x", init: { method: "GET" } }]);
  });
});
