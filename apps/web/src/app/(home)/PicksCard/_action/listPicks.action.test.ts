import { describe, expect, it, vi } from "vitest";
import { createContainer } from "@composition/createContainer";

const count = (sent: { path: string; init: RequestInit }[], path: string, method: string) =>
  sent.filter((s) => s.path === path && s.init.method === method).length;

/** 목록 캐시를 보는 화면이 하나 있고, 첫 목록을 받은 자리에서 시작한다 */
function setup() {
  const c = createContainer("test");
  const http = c.deps.http;
  http.respond("/api/picks", () => []);
  const picks = c.resolve("cache.picks.list");
  picks.subscribe(undefined, () => {});
  picks.ensure();
  return { c, http };
}

describe("listPicks — 전파 규칙", () => {
  it("픽을 저장하면 목록 캐시가 다시 받는다", async () => {
    const { c, http } = setup();
    await c.resolve("http.picks.save")([1, 2, 3, 4, 5, 6]);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
  });

  it("픽을 지우면 목록 캐시가 다시 받는다", async () => {
    const { c, http } = setup();
    http.respond("/api/picks/a%20b", () => undefined);
    await c.resolve("http.picks.delete")("a b");
    expect(count(http.sent, "/api/picks/a%20b", "DELETE")).toBe(1);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
  });
});
