// @framework/describe — store 출력에 state 마다 정의 자리·읽는 presenter·바꾸는 presenter 를 덧붙인다. 시험만 부른다
// (frontend-shared-state §6). 소스를 훑으므로 앱 번들에 실리지 않게 index 와 가른다
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { store } from ".";
import { statePrefixOf } from "./paths.mjs";

// 시험 러너(jsdom 환경)에서는 import.meta.url 이 file: 이 아니다 — 러너가 넣어 주는 __dirname 을 쓴다
const SRC = resolve(__dirname, "..");

function sources(): string[] {
  return (readdirSync(SRC, { recursive: true }) as string[])
    .map((entry) => join(SRC, entry))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));
}

const where = (file: string) => relative(SRC, file).replaceAll("\\", "/");

export function describeWithUsage(): string {
  const files = sources();
  const definedAt = new Map<string, string>();
  const readers = new Map<string, string[]>();
  const writers = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, name: string) =>
    map.set(key, [...new Set([...(map.get(key) ?? []), name])].sort());

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (/[\\/]_?state[\\/][^\\/]+\.state\.ts$/.test(file)) {
      // 정의 자리는 key 꼴이 그 파일의 소유 폴더와 맞을 때만 그 파일이다 — 맞지 않으면 검사기가 운다
      for (const [, key] of text.matchAll(/store\.state\(\s*"([^"]+)"/g)) {
        if (key!.startsWith(statePrefixOf(file))) definedAt.set(key!, where(file));
      }
    }
    if (/\.presenter\.tsx?$/.test(file)) {
      const name = basename(file).replace(/\.presenter\.tsx?$/, "");
      for (const [, head, key] of text.matchAll(/(?:const\s*\[([^\]]*)\]\s*=\s*)?useStoreState\(\s*"([^"]+)"/g)) {
        const [value, actions] = (head ?? "x").split(",").map((part) => part.trim());
        if (value) add(readers, key!, name);
        if (actions) add(writers, key!, name);
      }
    }
  }

  const list = (names: string[] | undefined) => (names?.length ? names.join(", ") : "없다");
  return store
    .describe()
    .split("\n")
    .flatMap((line, i, lines) => {
      const key = /^state\.\S+(?= = )/.exec(line)?.[0];
      if (key) return [line, `  정의: ${definedAt.get(key) ?? "찾지 못했다"}`];
      const owner = /^state\.\S+(?= = )/.exec(lines[i - 1] ?? "")?.[0];
      if (owner && line.startsWith("  바꾸는 함수:")) {
        return [line, `  읽는 곳: ${list(readers.get(owner))}`, `  바꾸는 곳: ${list(writers.get(owner))}`];
      }
      return [line];
    })
    .join("\n");
}
