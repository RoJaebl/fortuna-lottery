// @framework/describe — store 출력 앞에 공통 상태 key 마다 처음 값·바꾸는 함수·정의 자리·쓰는 presenter 를 단다.
// 시험만 부른다(frontend-shared-state §6). 소스를 훑으므로 앱 번들에 실리지 않게 index 와 가른다
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { getStore, registeredKeys } from "@fortuna-lottery/store";
import { store } from ".";

// 시험 러너(jsdom 환경)에서는 import.meta.url 이 file: 이 아니다 — 러너가 넣어 주는 __dirname 을 쓴다
const SRC = resolve(__dirname, "..");

function sources(): string[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    .map((entry) => join(SRC, entry))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));
}

const where = (file: string) => relative(SRC, file).replaceAll("\\", "/");

type AnyStore = { getInitialState(): Record<string, unknown> };

export function describeWithUsage(): string {
  const definedAt = new Map<string, string>();
  const users = new Map<string, string[]>();
  for (const file of sources()) {
    const text = readFileSync(file, "utf8");
    if (/\.state\.ts$/.test(file)) {
      for (const [, key] of text.matchAll(/createStore\(\s*"([^"]+)"/g)) definedAt.set(key!, where(file));
    }
    if (/\.presenter\.tsx?$/.test(file)) {
      const name = basename(file).replace(/\.presenter\.tsx?$/, "");
      for (const [, key] of text.matchAll(/(?:useSharedState|useStore)\(\s*"([^"]+)"/g)) {
        users.set(key!, [...new Set([...(users.get(key!) ?? []), name])].sort());
      }
    }
  }

  const stateLines = registeredKeys().flatMap((key) => {
    const entries = Object.entries((getStore as (k: string) => AnyStore)(key).getInitialState());
    const values = Object.fromEntries(entries.filter(([, v]) => typeof v !== "function"));
    const actions = entries.filter(([, v]) => typeof v === "function").map(([k]) => k).sort();
    return [
      `${key} = ${JSON.stringify(values)}`,
      `  바꾸는 함수: ${actions.join(", ")}`,
      `  정의: ${definedAt.get(key) ?? "찾지 못했다"}`,
      `  쓰는 곳: ${users.get(key)?.join(", ") || "없다"}`,
    ];
  });
  return ["[state]", ...stateLines, store.describe()].join("\n");
}
