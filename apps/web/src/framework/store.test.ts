import { describe, expect, it, vi } from "vitest";
import { EventChannel } from "@lib/events";
import { createAppStore } from ".";

// 등록부(StoreRegistry)는 앱의 key 로 채워지므로, 시험 key 는 단언으로 넘긴다
const k = (key: string) => key as never;
const deps = () => ({ http: { tag: "h" } as never, events: new EventChannel() });
const entry = () => ({ invalidate: vi.fn(), n: 0 }) as never;

describe("규약 층의 store — 영역 다섯", () => {
  it("cache·http 의 등록 콜백은 deps 를 받되 사건 통로는 받지 않고, http 만 emit 을 받는다", () => {
    const { store } = createAppStore();
    let cacheArg: object | undefined;
    let httpArg: { emit?: unknown } | undefined;
    store.cache(k("cache.t.list"), (d) => ((cacheArg = d), entry()));
    store.http(k("http.t.save"), (d) => ((httpArg = d), (async () => undefined) as never));
    const c = store.container(deps());
    c.resolve(k("cache.t.list"));
    c.resolve(k("http.t.save"));
    expect(cacheArg).toHaveProperty("http");
    expect("events" in cacheArg!).toBe(false);
    expect(typeof httpArg!.emit).toBe("function");
  });

  it("emit 은 등록된 사건만 사건 통로로 낸다", () => {
    let emit!: (key: never, payload: never) => void;
    const make = (declare: boolean) => {
      const { store } = createAppStore();
      store.http(k("http.t.save"), (d) => ((emit = d.emit), (async () => undefined) as never));
      if (declare) store.event(k("event.t.saved"), { from: "tab" });
      const d = deps();
      const got = vi.fn();
      d.events.on("event.t.saved", got);
      store.container(d).resolve(k("http.t.save"));
      return got;
    };
    make(false);
    expect(() => emit(k("event.t.saved"), { n: 1 } as never)).toThrow("등록되지 않은 사건이다: event.t.saved");
    const got = make(true);
    emit(k("event.t.saved"), { n: 1 } as never);
    expect(got).toHaveBeenCalledWith({ n: 1 });
  });

  it("invalidates 는 사건이 나면 지어진 캐시만 무효화하고, unaffected 는 출력에만 실린다", () => {
    const { store } = createAppStore();
    const other = vi.fn(entry);
    store.cache(k("cache.t.list"), entry);
    store.cache(k("cache.t.other"), other);
    store.cache(k("cache.t.kept"), entry);
    store.event(k("event.t.saved"), { from: "tab" });
    store.invalidates(k("event.t.saved"), k("cache.t.list"), { from: "tab" });
    store.invalidates(k("event.t.saved"), k("cache.t.other"), { from: "tab" });
    store.unaffected(k("event.t.saved"), k("cache.t.kept"), "사람이 누를 때 받는다");
    const d = deps();
    const c = store.container(d);
    const list = c.resolve(k("cache.t.list")) as { invalidate: () => void };
    const kept = c.resolve(k("cache.t.kept")) as { invalidate: () => void };
    d.events.emit("event.t.saved", { n: 1 });
    expect(list.invalidate).toHaveBeenCalledTimes(1);
    expect(kept.invalidate).not.toHaveBeenCalled();
    expect(other).not.toHaveBeenCalled();
  });

  it("전파 규칙이 등록되지 않은 사건이나 캐시를 가리키면 container 가 key 이름으로 실패한다", () => {
    const a = createAppStore().store;
    a.cache(k("cache.t.list"), entry);
    a.invalidates(k("event.t.saved"), k("cache.t.list"), { from: "tab" });
    expect(() => a.container(deps())).toThrow("등록되지 않은 사건이다: event.t.saved");
    const b = createAppStore().store;
    b.event(k("event.t.saved"), { from: "tab" });
    b.unaffected(k("event.t.saved"), k("cache.t.other"), "사유");
    expect(() => b.container(deps())).toThrow("등록되지 않은 key 다: cache.t.other");
  });

  it("route 는 공급자 없이 등록된 주소 함수를 돌려주고, 없는 key 는 이름으로 실패한다", () => {
    const { store, route } = createAppStore();
    store.route(k("route.t.detail"), ((id: string) => `/t/${id}`) as never);
    expect((route(k("route.t.detail")) as (id: string) => string)("7")).toBe("/t/7");
    expect(() => route(k("route.t.none"))).toThrow("등록되지 않은 key 다: route.t.none");
  });

  it("state 는 컨테이너마다 상태 하나를 짓는다", () => {
    const { store } = createAppStore();
    store.state(k("state.t.count"), { initial: 0, actions: { add: (now: number, n: number) => now + n } } as never);
    const c1 = store.container(deps());
    const c2 = store.container(deps());
    expect(c1.resolve(k("state.t.count"))).toBe(c1.resolve(k("state.t.count")));
    expect(c1.resolve(k("state.t.count"))).not.toBe(c2.resolve(k("state.t.count")));
  });

  it("describe 는 영역 다섯을 key 순으로 찍고 사건 아래에 그 규칙을 단다", () => {
    const { store } = createAppStore();
    store.route(k("route.t.index"), (() => "/t") as never);
    store.unaffected(k("event.t.saved"), k("cache.t.other"), "사람이 누를 때 받는다");
    store.invalidates(k("event.t.saved"), k("cache.t.list"), { from: "tab" });
    store.event(k("event.t.saved"), { from: "tab" });
    store.http(k("http.t.save"), () => (async () => undefined) as never);
    store.cache(k("cache.t.other"), entry);
    store.cache(k("cache.t.list"), entry);
    store.state(k("state.t.open"), { initial: false, actions: { toggle: (now: boolean) => !now } } as never);
    expect(store.describe()).toBe(
      [
        "[state]",
        "state.t.open = false",
        "  바꾸는 함수: toggle",
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
});
