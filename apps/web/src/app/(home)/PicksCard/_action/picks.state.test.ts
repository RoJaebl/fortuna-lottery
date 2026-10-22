import { describe, expect, it, vi } from "vitest";
import { getStore, overrideStore } from "@fortuna-lottery/store";
import { TestHttpClient } from "@infrastructure/http";

const count = (http: TestHttpClient, path: string, method: string) =>
  http.sent.filter((s) => s.path === path && s.init.method === method).length;

const wire = (id: string) => ({ id, numbers: [1, 2, 3, 4, 5, 6], createdAt: "2026-10-22T00:00:00.000Z" });

/** 목록은 a·b 둘이고, 저장하면 응답으로 p1 을 돌려준다. 첫 목록을 받은 자리에서 시작한다 */
async function setup() {
  const http = new TestHttpClient();
  overrideStore("infra.http", () => ({ client: http }));
  http.respond("/api/picks", () => (http.sent.at(-1)!.init.method === "POST" ? wire("p1") : [wire("a"), wire("b")]));
  const picks = getStore("api.home.PicksCard.picks").getState();
  await picks.fetch();
  const heard = vi.fn();
  getStore("event.home.PicksCard.changed").getState().on("test", heard);
  return { http, picks, heard };
}

describe("api.home.PicksCard.picks", () => {
  it("저장하면 응답으로 목록 맨 앞에 더하고 다시 받지 않는다", async () => {
    const { http, picks } = await setup();
    await picks.save([1, 2, 3, 4, 5, 6]);
    expect(count(http, "/api/picks", "GET")).toBe(1);
    expect(picks.getData()?.[0]?.id).toBe("p1");
  });

  it("저장하면 event.home.PicksCard.changed 가 { kind: \"saved\" } 로 나간다", async () => {
    const { picks, heard } = await setup();
    await picks.save([1, 2, 3, 4, 5, 6]);
    expect(heard).toHaveBeenCalledWith({ kind: "saved" });
  });

  it("저장이 실패하면 event 를 내지 않는다", async () => {
    const { http, picks, heard } = await setup();
    http.respond("/api/picks", () => {
      throw new Error("저장 거절");
    });
    await expect(picks.save([1, 2, 3, 4, 5, 6])).rejects.toThrow("저장 거절");
    expect(heard).not.toHaveBeenCalled();
  });

  it("삭제는 먼저 목록에서 빼고, 실패하면 되돌린다", async () => {
    const { http, picks, heard } = await setup();
    let fail!: (e: Error) => void;
    http.respond("/api/picks/a", () => new Promise((_, reject) => (fail = reject)));
    const removing = picks.remove("a");
    expect(picks.getData()?.map((p) => p.id)).toEqual(["b"]);
    fail(new Error("삭제 거절"));
    await expect(removing).rejects.toThrow("삭제 거절");
    expect(picks.getData()?.map((p) => p.id)).toEqual(["a", "b"]);
    expect(heard).not.toHaveBeenCalled();
  });

  it("삭제 경로는 /api/picks/${encodeURIComponent(id)} 의 DELETE 다", async () => {
    const { http, picks, heard } = await setup();
    http.respond("/api/picks/a%20b", () => undefined);
    await picks.remove("a b");
    expect(count(http, "/api/picks/a%20b", "DELETE")).toBe(1);
    expect(heard).toHaveBeenCalledWith({ kind: "removed" });
  });
});
