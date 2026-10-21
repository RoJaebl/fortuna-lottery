import { afterEach, describe, expect, it, vi } from "vitest";
import { createState, createStore, defineArea } from ".";

// 엔진은 영역의 이름을 모른다 — 시험은 영역 둘을 손으로 지어 꽂는다
const thing = defineArea<() => object, object, { tag: string }>({
  prefix: "thing.",
  check: (key, def) => {
    if (typeof def !== "function") throw new Error(`짓는 법이 함수가 아니다: ${key}`);
  },
  build: (def) => def(),
});
const label = defineArea<string, never, unknown>({
  prefix: "label.",
  describe: (defs) => [...defs].map(([key, text]) => `${key} = ${text}`),
});
const make = () => createStore({ thing, label });

afterEach(() => vi.unstubAllEnvs());

describe("createStore", () => {
  it("꽂은 영역 이름이 곧 등록 함수 이름이다", () => {
    const store = make();
    store.thing("thing.a", () => ({}));
    store.label("label.b", "비");
    expect(store.definition("label.b")).toBe("비");
  });

  it("영역의 접두가 아닌 key 와 검사에 걸린 정의는 key 이름으로 실패한다", () => {
    const store = make();
    expect(() => store.thing("label.x", () => ({}))).toThrow("thing 영역의 key 는 thing. 로 시작한다: label.x");
    expect(() => store.thing("thing.x", "x" as never)).toThrow("짓는 법이 함수가 아니다: thing.x");
  });

  it("컨테이너는 처음 꺼낼 때 한 번 짓고, 컨테이너가 다르면 인스턴스도 다르다", () => {
    const store = make();
    const build = vi.fn(() => ({}));
    store.thing("thing.a", build);
    const c = store.container({ tag: "t" });
    expect(c.resolve("thing.a")).toBe(c.resolve("thing.a"));
    expect(build).toHaveBeenCalledTimes(1);
    expect(store.container({ tag: "t" }).resolve("thing.a")).not.toBe(c.resolve("thing.a"));
    expect(c.deps).toEqual({ tag: "t" });
  });

  it("짓는 법이 없는 영역의 key 와 등록되지 않은 key 는 꺼내지 못한다", () => {
    const store = make();
    store.label("label.b", "비");
    expect(() => store.container({ tag: "t" }).resolve("label.b")).toThrow("등록되지 않은 토큰이다: label.b");
    expect(() => store.definition("thing.none")).toThrow("등록되지 않은 key 다: thing.none");
  });

  it("컨테이너가 설 때 영역의 attach 가 그 영역의 정의를 받는다", () => {
    const attach = vi.fn();
    const store = createStore({ label: defineArea<string, never, unknown>({ prefix: "label.", attach }) });
    store.label("label.b", "비");
    store.container({});
    expect([...attach.mock.calls[0]![0].keys()]).toEqual(["label.b"]);
  });

  it("개발 모드에서는 뒤의 등록이 이기고 운영 빌드에서는 실패한다", () => {
    const store = make();
    store.label("label.b", "앞");
    store.label("label.b", "뒤");
    expect(store.definition("label.b")).toBe("뒤");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => store.label("label.b", "또")).toThrow("같은 key 를 두 번 등록했다: label.b");
  });

  it("describe 는 영역별로 key 순으로 찍고 꼴은 영역이 정한다", () => {
    const store = make();
    store.label("label.z", "제트");
    store.label("label.a", "에이");
    store.thing("thing.b", () => ({}));
    expect(store.describe()).toBe(["[thing]", "thing.b", "[label]", "label.a = 에이", "label.z = 제트"].join("\n"));
  });
});

describe("createState", () => {
  it("이름 붙은 바꾸는 함수로만 바뀌고, 바뀌면 구독자에게 알린다", () => {
    const cell = createState({
      initial: 0,
      actions: { add: (now: number, n: number) => now + n, keep: (now: number) => now },
    });
    const fn = vi.fn();
    const off = cell.subscribe(fn);
    cell.actions.add(2);
    cell.actions.keep();
    expect(cell.get()).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1); // 같은 값이면 알리지 않는다
    off();
    cell.actions.add(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cell.initial).toBe(0);
  });
});
