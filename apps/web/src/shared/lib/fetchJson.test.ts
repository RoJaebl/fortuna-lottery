import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "./fetchJson";

afterEach(() => vi.unstubAllGlobals());

describe("fetchJson", () => {
  it("성공하면 본문을 그대로 돌려준다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ numbers: [1] })));
    await expect(fetchJson("/api/x")).resolves.toEqual({ numbers: [1] });
  });

  it("실패하면 본문의 error 를 메시지로 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "잘못된 요청" }, { status: 400 })));
    await expect(fetchJson("/api/x")).rejects.toThrow("잘못된 요청");
  });

  it("본문이 JSON 이 아니면 상태 코드로 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("oops", { status: 502 })));
    await expect(fetchJson("/api/x")).rejects.toThrow("요청 실패 (502)");
  });
});
