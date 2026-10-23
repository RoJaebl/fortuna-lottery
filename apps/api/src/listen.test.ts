import { describe, expect, it, vi } from "vitest";
import { listenOnPort } from "./listen.js";

const inUse = () => Object.assign(new Error("listen EADDRINUSE"), { code: "EADDRINUSE" });
const opts = { strict: true, attempts: 5, delayMs: 1000 };

describe("listenOnPort", () => {
  it("EADDRINUSE 두 번 뒤 성공한다", async () => {
    const listen = vi.fn<(port: number) => Promise<void>>().mockRejectedValueOnce(inUse()).mockRejectedValueOnce(inUse()).mockResolvedValue();
    const sleep = vi.fn(async () => {});
    await listenOnPort(listen, 4100, { ...opts, sleep });
    expect(listen).toHaveBeenCalledTimes(3);
    expect(listen).toHaveBeenCalledWith(4100);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it("계속 쥐여 있으면 5 번 뒤 던진다", async () => {
    const listen = vi.fn<(port: number) => Promise<void>>().mockRejectedValue(inUse());
    const sleep = vi.fn(async () => {});
    await expect(listenOnPort(listen, 4100, { ...opts, sleep })).rejects.toMatchObject({ code: "EADDRINUSE" });
    expect(listen).toHaveBeenCalledTimes(5);
    expect(listen.mock.calls.every(([p]) => p === 4100)).toBe(true);
  });

  it("다른 오류는 바로 던진다", async () => {
    const listen = vi.fn<(port: number) => Promise<void>>().mockRejectedValue(new Error("boom"));
    const sleep = vi.fn(async () => {});
    await expect(listenOnPort(listen, 4100, { ...opts, sleep })).rejects.toThrow("boom");
    expect(listen).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("strict 가 아니면 EADDRINUSE 도 기다리지 않고 던진다", async () => {
    const listen = vi.fn<(port: number) => Promise<void>>().mockRejectedValue(inUse());
    const sleep = vi.fn(async () => {});
    await expect(listenOnPort(listen, 4100, { ...opts, strict: false, sleep })).rejects.toMatchObject({ code: "EADDRINUSE" });
    expect(listen).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
