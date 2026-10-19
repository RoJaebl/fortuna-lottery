import { describe, expect, it, vi } from "vitest";
import { TEST_HTTP } from "@infrastructure/http";
import { CHECK_RESULTS, DELETE_PICK, LIST_PICKS, SAVE_PICK } from "@app/(home)";
import { createContainer } from "./createContainer";

const count = (sent: { path: string; init: RequestInit }[], path: string, method: string) =>
  sent.filter((s) => s.path === path && s.init.method === method).length;

/** 목록 캐시를 보는 화면이 하나 있고, 첫 목록을 받은 자리에서 시작한다 */
function setup() {
  const c = createContainer("test");
  const http = c.resolve(TEST_HTTP);
  http.respond("/api/picks", () => []);
  const picks = c.resolve(LIST_PICKS);
  picks.subscribe(undefined, () => {});
  picks.ensure();
  return { c, http };
}

describe("propagation", () => {
  it("픽을 저장하면 목록 캐시가 다시 받는다", async () => {
    const { c, http } = setup();
    await c.resolve(SAVE_PICK)([1, 2, 3, 4, 5, 6]);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
  });

  it("픽을 지우면 목록 캐시가 다시 받는다", async () => {
    const { c, http } = setup();
    http.respond("/api/picks/a%20b", () => undefined);
    await c.resolve(DELETE_PICK)("a b");
    expect(count(http.sent, "/api/picks/a%20b", "DELETE")).toBe(1);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
  });

  it("픽을 저장해도 당첨 대조 캐시는 다시 받지 않는다", async () => {
    const { c, http } = setup();
    http.respond("/api/results", () => ({ draw: null, items: [] }));
    const results = c.resolve(CHECK_RESULTS);
    results.subscribe(undefined, () => {});
    results.ensure();
    await c.resolve(SAVE_PICK)([1, 2, 3, 4, 5, 6]);
    await vi.waitFor(() => expect(count(http.sent, "/api/picks", "GET")).toBe(2));
    expect(count(http.sent, "/api/results", "GET")).toBe(1);
  });
});
