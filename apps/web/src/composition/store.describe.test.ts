import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getStore, registeredKeys, resetStores } from "supa-store";

// 시험 러너(jsdom 환경)에서는 import.meta.url 이 file: 이 아니다 — 러너가 넣어 주는 __dirname 을 쓴다
const SRC = resolve(__dirname, "..");
// 자원이 늘 가진 칸 — 이것을 뺀 함수 칸이 정의한 바꾸기다
const CACHE_FIELDS = ["fetch", "getData", "setData", "invalidate"];

type EventRecord = { on: string[]; exempt: Array<{ who: string; why: string }> };
const stateOf = (key: string) => (getStore as (k: string) => { getState(): Record<string, unknown> })(key).getState();
const where = (file: string) => relative(SRC, file).replaceAll("\\", "/");
const list = (names: string[]) => names.join(", ") || "없다";

/**
 * 등록된 store 를 모두 지은 뒤 세 절을 낸다.
 * - [state] key 마다 처음 값·바꾸는 함수·정의 자리·쓰는 곳. 쓰는 곳은 useStore 로 꺼내는 presenter 와 ctx 로 꺼내는 정의의 key 다
 * - [event] key 마다 반응하는(on) store 와 일부러 반응하지 않는(exempt) store 와 그 까닭
 * - [자원] key 마다 조회가 있는지와 바꾸기 이름
 * 소스를 글자로 훑는 근사다 — 쓰는 곳은 useStore("…")·ctx("…") 에 key 를 문자열로 적은 것만 센다(state-key-literal 이 지킨다)
 */
function describeStores(): string {
  const files = (readdirSync(SRC, { recursive: true }) as string[])
    .map((entry) => join(SRC, entry))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));
  const definedAt = new Map<string, string>();
  const users = new Map<string, Set<string>>();
  const use = (key: string, who: string) => users.set(key, (users.get(key) ?? new Set()).add(who));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (/\.state\.ts$/.test(file)) {
      const own = text.match(/createStore\(\s*"([^"]+)"/)?.[1];
      if (!own) continue;
      definedAt.set(own, where(file));
      // 제 key 는 세지 않는다 — 주석에 적은 ctx("…") 가 자기를 쓰는 곳으로 잡힌다
      for (const [, key] of text.matchAll(/\bctx\(\s*"([^"]+)"/g)) if (key !== own) use(key!, own);
    }
    if (/\.presenter\.tsx?$/.test(file)) {
      const name = basename(file).replace(/\.presenter\.tsx?$/, "");
      for (const [, key] of text.matchAll(/\buseStore\(\s*"([^"]+)"/g)) use(key!, name);
    }
  }

  const keys = registeredKeys();
  // 먼저 모두 짓는다 — event 의 on·exempt 는 듣는 쪽 store 를 지을 때 걸린다
  const states = new Map(keys.map((key) => [key, stateOf(key)]));
  const functions = (state: Record<string, unknown>) =>
    Object.keys(state).filter((name) => typeof state[name] === "function").sort();

  const stateLines = keys.flatMap((key) => {
    const state = states.get(key)!;
    const values = Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== "function"));
    return [
      `${key} = ${JSON.stringify(values)}`,
      `  바꾸는 함수: ${list(functions(state))}`,
      `  정의: ${definedAt.get(key) ?? "찾지 못했다"}`,
      `  쓰는 곳: ${list([...(users.get(key) ?? [])].sort())}`,
    ];
  });

  const eventLines = keys
    .filter((key) => typeof states.get(key)!.record === "function")
    .flatMap((key) => {
      const record = (states.get(key)!.record as () => EventRecord)();
      return [
        key,
        ...record.on.map((who) => `  on     ${who}`),
        ...record.exempt.map(({ who, why }) => `  exempt ${who} — ${why}`),
      ];
    });

  const resourceLines = keys
    .filter((key) => CACHE_FIELDS.every((name) => typeof states.get(key)![name] === "function"))
    .flatMap((key) => {
      const source = definedAt.get(key) ? readFileSync(join(SRC, definedAt.get(key)!), "utf8") : "";
      return [
        key,
        `  조회: ${/\bquery\s*[:(]/.test(source) ? "있다" : "없다"}`,
        `  바꾸기: ${list(functions(states.get(key)!).filter((name) => !CACHE_FIELDS.includes(name)))}`,
      ];
    });

  return ["[state]", ...stateLines, "[event]", ...eventLines, "[자원]", ...resourceLines].join("\n");
}

describe("store", () => {
  it("store 에 등록된 전부", () => {
    // 「무엇이 무엇을 갱신하는가」와 「어느 presenter 가 어느 상태를 쓰는가」를 읽는 자리
    // 시계 store 는 지은 순간의 시각을 처음 값으로 가지므로 시각을 0 에 묶어 짓는다
    vi.useFakeTimers({ now: 0 });
    resetStores();
    try {
      expect(describeStores()).toMatchSnapshot();
    } finally {
      vi.useRealTimers();
    }
  });

  it("픽이 바뀌어도 당첨 대조는 일부러 다시 받지 않는다", () => {
    const lines = describeStores().split("\n");
    const at = lines.indexOf("event.home.PicksCard.changed");
    expect(at).toBeGreaterThan(lines.indexOf("[event]"));
    expect(lines.slice(at + 1)).toContain(
      "  exempt api.home.ResultsCard.check — 결과는 사람이 「당첨 대조」를 눌러 받는다 — 누르기 전까지 앞선 결과를 그대로 보인다",
    );
  });

  it("state 절은 key 마다 처음 값·바꾸는 함수·정의·쓰는 곳을 찍는다", () => {
    const lines = describeStores().split("\n");
    const at = lines.indexOf("state.home.combination = {\"numbers\":null}");
    expect(lines.slice(at, at + 4)).toEqual([
      'state.home.combination = {"numbers":null}',
      "  바꾸는 함수: choose",
      "  정의: app/(home)/_state/combination.state.ts",
      "  쓰는 곳: GeneratorCard, HypothesisLab, PicksCard, SimulationCard, StatisticsPanel",
    ]);
  });
});
