import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Container } from ".";
import { StoreProvider, useStore } from "./react";
import { createStore, type EventChannel } from "./store";

interface Reg {
  "cache.t.list": { invalidate(): void; n: number };
  "cache.t.other": { invalidate(): void; n: number };
  "http.t.save": (n: number) => Promise<void>;
  "event.t.saved": { n: number };
  "route.t.index": () => string;
  "route.t.detail": (id: string) => string;
}
interface Deps {
  http: { tag: string };
}

function channel(): EventChannel {
  const hs = new Map<string, Array<(p: unknown) => void>>();
  return {
    on(name, fn) {
      hs.set(name, [...(hs.get(name) ?? []), fn]);
      return () => undefined;
    },
    emit(name, payload) {
      (hs.get(name) ?? []).forEach((f) => f(payload));
    },
  };
}
const deps = () => ({ http: { tag: "h" }, events: channel() });
const entry = () => ({ invalidate: vi.fn(), n: 0 });

afterEach(() => vi.unstubAllEnvs());

describe("store", () => {
  it("cache 는 처음 꺼낼 때 한 번 짓고 같은 인스턴스를 내준다", () => {
    const { store } = createStore<Reg, Deps>();
    const build = vi.fn(entry);
    store.cache("cache.t.list", build);
    const c = store.container(deps());
    expect(c.resolve("cache.t.list")).toBe(c.resolve("cache.t.list"));
    expect(build).toHaveBeenCalledTimes(1);
  });

  it("컨테이너가 다르면 인스턴스도 다르다", () => {
    const { store } = createStore<Reg, Deps>();
    store.cache("cache.t.list", entry);
    expect(store.container(deps()).resolve("cache.t.list")).not.toBe(
      store.container(deps()).resolve("cache.t.list"),
    );
  });

  it("등록 콜백은 deps 를 받되 사건 통로는 받지 않는다", () => {
    const { store } = createStore<Reg, Deps>();
    let cacheArg: object | undefined;
    let httpArg: { emit?: unknown } | undefined;
    store.cache("cache.t.list", (d) => {
      cacheArg = d;
      return entry();
    });
    store.http("http.t.save", (d) => {
      httpArg = d;
      return async () => undefined;
    });
    const c = store.container(deps());
    c.resolve("cache.t.list");
    c.resolve("http.t.save");
    expect(cacheArg).toHaveProperty("http");
    expect("events" in cacheArg!).toBe(false);
    expect(typeof httpArg!.emit).toBe("function");
  });

  it("emit 은 등록된 사건만 사건 통로로 낸다", () => {
    const { store } = createStore<Reg, Deps>();
    let emit!: (k: "event.t.saved", p: { n: number }) => void;
    store.http("http.t.save", (d) => {
      emit = d.emit;
      return async () => undefined;
    });
    const d = deps();
    const got = vi.fn();
    d.events.on("event.t.saved", got);
    store.container(d).resolve("http.t.save");
    expect(() => emit("event.t.saved", { n: 1 })).toThrow(
      "등록되지 않은 사건이다: event.t.saved",
    );
    store.event("event.t.saved", { from: "tab" });
    emit("event.t.saved", { n: 1 });
    expect(got).toHaveBeenCalledWith({ n: 1 });
  });

  it("invalidates 는 사건이 나면 지어진 캐시만 무효화한다", () => {
    const { store } = createStore<Reg, Deps>();
    const other = vi.fn(entry);
    store.cache("cache.t.list", entry);
    store.cache("cache.t.other", other);
    store.event("event.t.saved", { from: "tab" });
    store.invalidates("event.t.saved", "cache.t.list", { from: "tab" });
    store.invalidates("event.t.saved", "cache.t.other", { from: "tab" });
    const d = deps();
    const list = store.container(d).resolve("cache.t.list");
    d.events.emit("event.t.saved", { n: 1 });
    expect(list.invalidate).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
  });

  it("unaffected 는 무효화하지 않고 describe 에만 실린다", () => {
    const { store } = createStore<Reg, Deps>();
    store.cache("cache.t.other", entry);
    store.event("event.t.saved", { from: "tab" });
    store.unaffected("event.t.saved", "cache.t.other", "사람이 누를 때 받는다");
    const d = deps();
    const other = store.container(d).resolve("cache.t.other");
    d.events.emit("event.t.saved", { n: 1 });
    expect(other.invalidate).not.toHaveBeenCalled();
    expect(store.describe()).toContain("일부러 낡게 하지 않는다: cache.t.other");
  });

  it("전파 규칙이 등록되지 않은 사건이나 캐시를 가리키면 container 가 key 이름으로 실패한다", () => {
    const a = createStore<Reg, Deps>().store;
    a.cache("cache.t.list", entry);
    a.invalidates("event.t.saved", "cache.t.list", { from: "tab" });
    expect(() => a.container(deps())).toThrow("등록되지 않은 사건이다: event.t.saved");
    const b = createStore<Reg, Deps>().store;
    b.event("event.t.saved", { from: "tab" });
    b.invalidates("event.t.saved", "cache.t.list", { from: "tab" });
    expect(() => b.container(deps())).toThrow("등록되지 않은 key 다: cache.t.list");
    const c = createStore<Reg, Deps>().store;
    c.cache("cache.t.other", entry);
    c.unaffected("event.t.saved", "cache.t.other", "사유");
    expect(() => c.container(deps())).toThrow("등록되지 않은 사건이다: event.t.saved");
    const d = createStore<Reg, Deps>().store;
    d.event("event.t.saved", { from: "tab" });
    d.unaffected("event.t.saved", "cache.t.other", "사유");
    expect(() => d.container(deps())).toThrow("등록되지 않은 key 다: cache.t.other");
  });

  it("등록되지 않은 key 를 꺼내면 key 이름으로 실패한다", () => {
    const { store, route } = createStore<Reg, Deps>();
    expect(() => store.container(deps()).resolve("cache.t.list")).toThrow(
      "등록되지 않은 key 다: cache.t.list",
    );
    expect(() => route("route.t.index")).toThrow("등록되지 않은 key 다: route.t.index");
  });

  it("route 는 공급자 없이 등록된 주소 함수를 돌려준다", () => {
    const { store, route } = createStore<Reg, Deps>();
    store.route("route.t.detail", (id) => `/t/${id}`);
    expect(route("route.t.detail")("7")).toBe("/t/7");
  });

  it("개발 모드에서 같은 key 를 다시 등록하면 뒤의 것이 이긴다", () => {
    const { store } = createStore<Reg, Deps>();
    const first = vi.fn(entry);
    const second = vi.fn(entry);
    store.cache("cache.t.list", first);
    expect(() => store.cache("cache.t.list", second)).not.toThrow();
    store.container(deps()).resolve("cache.t.list");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("운영 빌드에서 같은 key 를 다시 등록하면 실패한다", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { store } = createStore<Reg, Deps>();
    store.cache("cache.t.list", entry);
    expect(() => store.cache("cache.t.list", entry)).toThrow(
      "같은 key 를 두 번 등록했다: cache.t.list",
    );
  });

  it("describe 는 영역별로 key 순으로 찍는다", () => {
    const { store } = createStore<Reg, Deps>();
    store.route("route.t.index", () => "/t");
    store.unaffected("event.t.saved", "cache.t.other", "사람이 누를 때 받는다");
    store.invalidates("event.t.saved", "cache.t.list", { from: "tab" });
    store.event("event.t.saved", { from: "tab" });
    store.http("http.t.save", () => async () => undefined);
    store.cache("cache.t.other", entry);
    store.cache("cache.t.list", entry);
    expect(store.describe()).toBe(
      [
        "[cache]",
        "cache.t.list",
        "cache.t.other",
        "[http]",
        "http.t.save",
        "[event]",
        "event.t.saved (from: tab)",
        "  낡게 한다: cache.t.list (from: tab)",
        "  일부러 낡게 하지 않는다: cache.t.other — 사람이 누를 때 받는다",
        "[route]",
        "route.t.index",
      ].join("\n"),
    );
  });

  it("useStore 는 공급자의 컨테이너에서 꺼내고 밖에서는 실패한다", () => {
    const { store } = createStore<Reg, Deps>();
    store.cache("cache.t.list", entry);
    const c = store.container(deps());
    // useStore 는 앱 StoreRegistry(이 시험에서는 비어 있다)로 타입이 잡히므로, 시험 store 의 컨테이너와 key 를 단언한다
    const container = c as unknown as Container;
    const key = "cache.t.list" as never;
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StoreProvider, { container, children });
    const { result } = renderHook(() => useStore(key), { wrapper });
    expect(result.current).toBe(c.resolve("cache.t.list"));
    expect(() => renderHook(() => useStore(key))).toThrow(
      "StoreProvider 밖에서 꺼냈다: cache.t.list",
    );
  });
});
