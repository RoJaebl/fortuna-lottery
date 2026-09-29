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

  it("보는 화면이 없어지면 쥔 값을 놓는다", async () => {
    const cache = createServerCache((q: number) => String(q), async (q: number) => q);
    const off = cache.subscribe(1, () => {});
    cache.ensure(1);
    await flush();

    off();

    expect(cache.read(1)).toBeUndefined();
  });
});
