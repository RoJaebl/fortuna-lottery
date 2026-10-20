import { describe, expect, it, vi } from "vitest";
import { createContainer } from "@composition/createContainer";

const count = (sent: { path: string; init: RequestInit }[], path: string, method: string) =>
  sent.filter((s) => s.path === path && s.init.method === method).length;

/** 목록 캐시와 당첨 대조 캐시를 보는 화면이 있고, 둘 다 한 번 받은 자리에서 시작한다 */
function setup() {
  const c = createContainer("test");
  const http = c.deps.http;
  http.respond("/api/picks", () => []);
  http.respond("/api/results", () => ({ draw: null, items: [] }));
  const picks = c.resolve("cache.picks.list");
  picks.subscribe(undefined, () => {});
  picks.ensure();
  const results = c.resolve("cache.results.check");
  results.subscribe(undefined, () => {});
  results.ensure();
  return { c, http };
}

describe("checkResults — 전파 규칙", () => {
  it("픽을 저장해도 당첨 대조 캐시는 다시 받지 않는다", async () => {
    const { c, http } = setup();
    await c.resolve("http.picks.save")([1, 2, 3, 4, 5, 6]);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
    expect(count(http.sent, "/api/results", "GET")).toBe(1);
  });

  it("픽을 지워도 당첨 대조 캐시는 다시 받지 않는다", async () => {
    const { c, http } = setup();
    http.respond("/api/picks/a", () => undefined);
    await c.resolve("http.picks.delete")("a");
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
    expect(count(http.sent, "/api/results", "GET")).toBe(1);
  });
});
