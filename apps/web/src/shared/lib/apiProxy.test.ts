// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyToApi, resetApiProxyLog } from "./apiProxy";

const refused = () => {
  const error = new TypeError("fetch failed");
  (error as { cause?: unknown }).cause = { code: "ECONNREFUSED" };
  return Promise.reject(error);
};

describe("proxyToApi", () => {
  beforeEach(() => resetApiProxyLog());

  it("경로·쿼리·메서드·본문을 그대로 넘긴다", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const request = new Request("http://web.test/api/picks?limit=3", {
      method: "POST",
      headers: { "content-type": "application/json", host: "web.test" },
      body: JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6] }),
    });

    await proxyToApi(request, ["picks"], {
      origin: "http://api.test:4000",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.test:4000/api/picks?limit=3");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(new Headers(init.headers).has("host")).toBe(false);
    expect(Buffer.from(init.body as ArrayBuffer).toString()).toBe(
      JSON.stringify({ numbers: [1, 2, 3, 4, 5, 6] }),
    );
  });

  it("상태 코드와 본문을 그대로 돌려준다(404 포함)", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "없음" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
    );
    const response = await proxyToApi(new Request("http://web.test/api/x"), ["x"], {
      origin: "http://api.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "없음" });
  });

  it("연결이 거절되면 503 과 오류 본문을 돌려준다", async () => {
    const response = await proxyToApi(new Request("http://web.test/api/x"), ["x"], {
      origin: "http://api.test",
      fetchImpl: refused as unknown as typeof fetch,
      log: () => {},
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "서버에 닿지 않습니다" });
  });

  it("5 초 안의 두 번째 실패는 로그를 남기지 않는다", async () => {
    const log = vi.fn();
    let t = 1000;
    const deps = {
      origin: "http://api.test",
      fetchImpl: refused as unknown as typeof fetch,
      log,
      now: () => t,
    };
    const request = () => new Request("http://web.test/api/x");
    await proxyToApi(request(), ["x"], deps);
    t += 4000;
    await proxyToApi(request(), ["x"], deps);
    expect(log).toHaveBeenCalledTimes(1);
    t += 1500;
    await proxyToApi(request(), ["x"], deps);
    expect(log).toHaveBeenCalledTimes(2);
  });
});
