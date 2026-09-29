import { describe, expect, it, vi } from "vitest";
import { createServerCache } from "./serverCache";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createServerCache", () => {
  it("같은 조건이면 ensure 를 여러 번 해도 load 는 한 번이다", async () => {
    const load = vi.fn(async (q: number) => q * 2);
    const cache = createServerCache((q: number) => String(q), load);
    const off = cache.subscribe(1, () => {});

    cache.ensure(1);
    cache.ensure(1);
    await flush();
    cache.ensure(1);

    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.read(1)).toEqual({ status: "ready", value: 2, error: null });
    off();
  });

  it("invalidate 하면 구독자가 알림을 받고 보고 있는 조건을 다시 받는다", async () => {
    const load = vi.fn(async (q: number) => q);
    const cache = createServerCache((q: number) => String(q), load);
    const fn = vi.fn();
    cache.subscribe(1, fn);
    cache.ensure(1);
    await flush();
    fn.mockClear();

    cache.invalidate();
    await flush();

    expect(fn).toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("넘어간 요청의 응답은 버린다", async () => {
    let resolveFirst!: (v: string) => void;
    const load = vi
      .fn<(q: number) => Promise<string>>()
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockImplementationOnce(async () => "새 값");
    const cache = createServerCache((q: number) => String(q), load);
    cache.subscribe(1, () => {});

    cache.ensure(1);
    cache.invalidate();
    await flush();
    resolveFirst("낡은 값");
    await flush();

    expect(cache.read(1)?.value).toBe("새 값");
  });

  it("invalidate 로 다시 받는 동안에는 앞선 값을 그대로 보인다", async () => {
    let resolveSecond!: (v: string) => void;
    const load = vi
      .fn<(q: number) => Promise<string>>()
      .mockImplementationOnce(async () => "앞선 값")
      .mockImplementationOnce(() => new Promise((r) => (resolveSecond = r)));
    const cache = createServerCache((q: number) => String(q), load);
    cache.subscribe(1, () => {});
    cache.ensure(1);
    await flush();

    cache.invalidate();

    expect(cache.read(1)).toEqual({ status: "loading", value: "앞선 값", error: null });
    resolveSecond("새 값");
    await flush();
    expect(cache.read(1)).toEqual({ status: "ready", value: "새 값", error: null });
  });

  it("invalidate 로 다시 받기에 실패하면 앞선 값을 지키고 오류를 알린다", async () => {
    const load = vi
      .fn<(q: number) => Promise<string>>()
      .mockImplementationOnce(async () => "앞선 값")
      .mockImplementationOnce(async () => {
        throw new Error("실패");
      });
    const cache = createServerCache((q: number) => String(q), load);
    cache.subscribe(1, () => {});
    cache.ensure(1);
    await flush();

    cache.invalidate();
    await flush();

    expect(cache.read(1)).toEqual({ status: "error", value: "앞선 값", error: "실패" });
  });

  it("보는 화면이 없어지면 쥔 값을 놓는다", async () => {
    const cache = createServerCache((q: number) => String(q), async (q: number) => q);
    const off = cache.subscribe(1, () => {});
    cache.ensure(1);
    await flush();

    off();

    expect(cache.read(1)).toBeUndefined();
  });
});
