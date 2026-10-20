import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { route, store, type KeyOf } from "@lib/store";
import "./screens";

/** page.tsx 를 가진 폴더의 주소 — 라우트 그룹 마디는 빠지고 동적 마디([id] 등)는 "x" 가 된다 */
function folderPaths(): string[] {
  const app = resolve(__dirname, "../app");
  return (readdirSync(app, { recursive: true }) as string[])
    .map((entry) => entry.split(/[\\/]/))
    .filter((parts) => parts.at(-1) === "page.tsx" && !["api", "(dev)"].includes(parts[0]!))
    .map((parts) =>
      parts
        .slice(0, -1)
        .filter((part) => !/^\(.*\)$/.test(part))
        .map((part) => part.replace(/^\[.*\]$/, "x")),
    )
    .map((parts) => `/${parts.join("/")}`);
}

/** describe() 의 [route] 아래 key 마다 주소 함수를 인자 수만큼 "x" 로 불러 얻은 주소 */
function routePaths(): string[] {
  const lines = store.describe().split("\n");
  return lines.slice(lines.indexOf("[route]") + 1).map((key) => {
    const fn = route(key as KeyOf<"route">) as (...args: string[]) => string;
    return fn(...Array<string>(fn.length).fill("x"));
  });
}

describe("store", () => {
  it("store 에 등록된 전부", () => {
    expect(store.describe()).toMatchSnapshot(); // 「무엇이 무엇을 갱신하는가」를 읽는 자리
  });

  it("page.tsx 를 가진 폴더마다 주소가 있고 주소마다 폴더가 있다", () => {
    expect(routePaths().sort()).toEqual(folderPaths().sort());
  });
});
