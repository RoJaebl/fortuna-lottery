# 공통 상태 라이브러리 1단계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** root 의 `packages/store` 에 공급자 없는 전역 상태 라이브러리와 타입 생성기를 세우고, `apps/web` 의 공통 상태 둘을 그리로 옮긴다.

**Architecture:** 런타임(`src/`)은 key 로 등록하는 전역 `Map` 과 `useSyncExternalStore` 훅이다. 생성기(`tools/`)는 TypeScript 컴파일러 API 로 `createStore` 정의의 반환 타입을 글자로 뽑아 `StateTypes` 선언과 등록 import 를 담은 생성 파일을 쓴다. 생성은 tsserver 플러그인·`withStore`(Next)·`store-gen`(CLI) 세 자리에서 하고, 프로젝트의 `store.config.ts` 가 `targets` 로 고른다.

**Tech Stack:** TypeScript 5.8, React 19, Next 15, vitest 3, `node --test`, pnpm 작업 공간, turbo, dependency-cruiser, ESLint 9.

**Spec:** [docs/superpowers/specs/2026-10-21-state-library-design.md](../specs/2026-10-21-state-library-design.md)

## Global Constraints

- 패키지 이름 `@fortuna-lottery/store`, 자리 `packages/store`, `"type": "module"`, `private: true`.
- 런타임 `src/` 는 `tsc` 로 `dist/` 에 빌드한다. `tools/` 는 빌드하지 않는 JS 다(`.cjs`·`.mjs`).
- peer: `react >=18`(optional), `typescript >=5.4`. 생성기는 쓰는 프로젝트의 TypeScript 를 빌려 쓴다. zustand 를 들이지 않는다.
- config 기본값: `include: ["src/**/*.state.ts"]`, `out: "src/store.gen.ts"`, `targets: ["tsserver"]`. config 파일 이름 `store.config.ts`, 자리는 프로젝트 뿌리(`package.json` 이 있는 폴더).
- glob 은 `*`(마디 하나)·`**`(마디 여럿) 둘만 지원한다.
- 실패 문구: `등록되지 않은 key 다: <key>`, `같은 key 를 두 번 등록했다: <key>`, `store-gen: targets 에 cli 가 없어 건너뛴다`.
- 생성 파일 첫 줄: `// 자동 생성 — @fortuna-lottery/store 가 쓴다. 고치지 않는다`. 덧붙이는 모듈: `declare module "@fortuna-lottery/store"`, 인터페이스 `StateTypes`.
- 생성 파일은 내용이 같으면 다시 쓰지 않는다.
- `StateTypes` 가 비면 `StateKey` 는 `never` 다. 물러남(`Record<string, …>` 등)을 두지 않는다.
- apps/web 의 config: `out: "src/composition/store.gen.ts"`, `targets: ["tsserver", "next", "cli"]`. key 는 바꾸지 않는다(`state.home.combination`, `state.home.generatorOpen`).
- 커밋 메시지는 저장소 관례(`feat(store): …` 처럼 type(scope) 와 한국어 설명)를 따르고 attribution 줄 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 로 끝낸다.
- 브랜치·워크트리는 실행 때 `git-strategy` 스킬이 정한다. 스펙과 이 계획은 구현 커밋보다 먼저 커밋한다(CLAUDE.md).

## Review Focus

- 경로에 괄호·대괄호가 든 정의 파일(`src/app/(home)/_state/x.state.ts`, `src/app/documents/[id]/_state/y.state.ts`) — glob 이 맞히고, 생성 파일의 import 경로가 그대로 풀려야 한다. Task 3 시험이 잡는다.
- Windows 경로(역슬래시) — config 의 `match`, 생성 파일의 import 경로, 플러그인의 「config.out 인가」 판정이 모두 `/` 로 정규화해야 한다. Task 3·5 시험이 잡는다.
- 첫 인자가 문자열 리터럴이 아니거나 둘째 인자가 함수가 아닌 `createStore` 호출 — 생성기가 죽지 않고 그 호출만 건너뛴다(그 꼴은 ESLint `state-key-literal` 이 따로 막는다). Task 3 시험이 잡는다.
- 정의 파일이 하나도 없는 프로젝트 — 생성 파일이 빈 `StateTypes` 를 담은 올바른 TypeScript 여야 한다. Task 3 시험이 잡는다.
- 문법이 깨진 `store.config.ts` — 플러그인이 tsserver 를 죽이지 않고 언어 서비스를 그대로 돌려주며 로그를 남긴다. CLI 는 config 파일 이름을 담아 실패한다. Task 5·4 시험이 잡는다.

---

### Task 1: 패키지 뼈대와 런타임

**Files:**
- Create: `packages/store/package.json`, `packages/store/tsconfig.json`, `packages/store/vitest.config.ts`
- Create: `packages/store/src/index.ts`
- Test: `packages/store/src/index.test.ts`

**Interfaces:**
- Produces (`@fortuna-lottery/store`):
  - `type SetState<T> = (partial: Partial<T> | ((now: T) => Partial<T>)) => void`
  - `type GetState<T> = () => T`
  - `interface StoreApi<T> { getState(): T; getInitialState(): T; setState: SetState<T>; subscribe(listener: () => void): () => void }`
  - `interface StateTypes {}`, `type StateKey = keyof StateTypes & string`, `type StateOf<K> = K extends StateKey ? StateTypes[K] : unknown`
  - `createStore<K extends string>(key: K, definition: (set: SetState<StateOf<K>>, get: GetState<StateOf<K>>) => object): void`
  - `getStore<K extends StateKey>(key: K): StoreApi<StateOf<K>>`
  - `resetStores(): void`, `registeredKeys(): string[]`

- [ ] **Step 1: 패키지 파일을 놓는다**

`package.json` 은 스펙 「패키지 구조」의 것을 쓰되 `exports["./next"]` 는 `{ "types": "./tools/next.d.mts", "default": "./tools/next.mjs" }` 로 둔다(Task 4 가 `.d.mts` 를 놓는다). `devDependencies`: `typescript ^5.8.0`, `vitest ^3.1.0`, `react ^19.1.0`, `@types/react ^19.1.0`, `@testing-library/react ^16.3.3`, `@testing-library/dom ^10.4.2`, `jsdom ^30.1.1`. `tsconfig.json` 은 `packages/kernel/tsconfig.json` 을 따르되 `"lib": ["ES2022", "DOM"]`, `"jsx": "react-jsx"`, `exclude` 에 `src/**/*.test.tsx` 를 더한다. `vitest.config.ts` 는 `include: ["src/**/*.test.{ts,tsx}"]`, `environment: "jsdom"`, `esbuild: { jsx: "automatic" }`. 뿌리에서 `pnpm install`.

- [ ] **Step 2: 실패하는 시험을 쓴다**

시험 파일은 `declare module "."` 로 `StateTypes` 에 시험 key 를 덧붙이고, 각 `it` 앞에서 `resetStores()` 를 부른다.

```ts
declare module "." {
  interface StateTypes {
    "state.test.count": { n: number; add: () => void };
    "state.test.pair": { a: number; b: number; setA: (a: number) => void };
  }
}

createStore("state.test.count", (set, get) => ({ n: 0, add: () => set({ n: get().n + 1 }) }));
createStore("state.test.pair", (set) => ({ a: 1, b: 2, setA: (a: number) => set({ a }) }));

it("등록하면 곧 읽힌다", () => {
  expect(getStore("state.test.count").getState().n).toBe(0);
});
it("setState 는 얕게 합치고 나머지 필드를 남긴다", () => {
  getStore("state.test.pair").getState().setA(5);
  expect(getStore("state.test.pair").getState()).toMatchObject({ a: 5, b: 2 });
});
it("함수 꼴 setState 가 지금 값을 받는다", () => {
  getStore("state.test.pair").setState((now) => ({ b: now.b * 10 }));
  expect(getStore("state.test.pair").getState().b).toBe(20);
});
it("같은 객체를 돌려주면 구독자를 부르지 않는다", () => {
  const store = getStore("state.test.pair");
  let calls = 0;
  store.subscribe(() => calls++);
  store.setState((now) => now);
  expect(calls).toBe(0);
});
it("구독을 풀면 더 부르지 않는다", () => {
  const store = getStore("state.test.count");
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.getState().add();
  off();
  store.getState().add();
  expect(calls).toBe(1);
});
it("resetStores 뒤에는 처음 값이고 구독자는 남아 알림을 받는다", () => {
  const store = getStore("state.test.count");
  let calls = 0;
  store.subscribe(() => calls++);
  store.getState().add();
  resetStores();
  expect(store.getState().n).toBe(0);
  expect(store.getInitialState().n).toBe(0);
  expect(calls).toBe(2);
});
it("개발 모드에서 같은 key 를 다시 등록하면 새 정의로 바뀌고 구독자는 남는다", () => {
  const store = getStore("state.test.count");
  let calls = 0;
  store.subscribe(() => calls++);
  createStore("state.test.count", (set, get) => ({ n: 100, add: () => set({ n: get().n + 1 }) }));
  expect(getStore("state.test.count")).toBe(store);
  expect(store.getState().n).toBe(100);
  expect(calls).toBe(1);
});
it("production 에서 같은 key 를 두 번 등록하면 실패한다", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(() => createStore("state.test.count", () => ({ n: 0, add() {} }))).toThrow(
    "같은 key 를 두 번 등록했다: state.test.count",
  );
  vi.unstubAllEnvs();
});
it("등록되지 않은 key 는 key 이름을 담아 실패한다", () => {
  expect(() => getStore("state.test.none" as never)).toThrow("등록되지 않은 key 다: state.test.none");
});
it("registeredKeys 는 정렬된 key 목록이다", () => {
  expect(registeredKeys()).toEqual(["state.test.count", "state.test.pair"]);
});
```

「개발 모드 재등록」 시험이 상태를 바꾸므로 그 `it` 끝에서 원래 정의로 다시 등록한다.

- [ ] **Step 3: 시험이 실패하는지 본다**

Run: `pnpm --filter @fortuna-lottery/store exec vitest run src/index.test.ts`
Expected: FAIL — `createStore` 를 찾지 못한다.

- [ ] **Step 4: `src/index.ts` 를 짓는다**

등록부는 `Map<string, { api: StoreApi<any>; reset(next?: Definition): void }>` 하나다. `reset` 은 지금 정의(또는 새 정의)를 `(setState, getState)` 로 불러 상태와 처음 값을 함께 바꾸고 구독자를 부른다. `setState` 의 동작은 스펙 「런타임」 그대로다(`Object.is` 생략, `Object.assign({}, now, partial)`).

- [ ] **Step 5: 시험과 빌드가 통과하는지 본다**

Run: `pnpm --filter @fortuna-lottery/store exec vitest run src/index.test.ts && pnpm --filter @fortuna-lottery/store build`
Expected: PASS, `packages/store/dist/index.js`·`index.d.ts` 가 생긴다.

- [ ] **Step 6: 커밋**

```bash
git add packages/store pnpm-lock.yaml
git commit -m "feat(store): key 로 등록하는 전역 상태 런타임을 세운다"
```

### Task 2: React 훅

**Files:**
- Create: `packages/store/src/react.ts`
- Test: `packages/store/src/react.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `getStore`, `StateKey`, `StateOf`.
- Produces (`@fortuna-lottery/store/react`): `useSharedState<K extends StateKey, U>(key: K, select: (state: StateOf<K>) => U): U`

- [ ] **Step 1: 실패하는 시험을 쓴다**

```tsx
it("고른 값이 바뀔 때만 다시 그린다", () => {
  let renders = 0;
  const { result } = renderHook(() => {
    renders += 1;
    return useSharedState("state.test.pair", (s) => s.a);
  });
  act(() => getStore("state.test.pair").setState({ b: 99 })); // 고른 값 a 는 그대로다
  expect(renders).toBe(1);
  act(() => getStore("state.test.pair").getState().setA(7));
  expect(result.current).toBe(7);
  expect(renders).toBe(2);
});
it("바꾸는 함수를 고르면 그 함수로 상태를 바꾼다", () => {
  const { result } = renderHook(() => useSharedState("state.test.count", (s) => s.add));
  act(() => result.current());
  expect(getStore("state.test.count").getState().n).toBe(1);
});
it("서버 렌더는 처음 값이다", () => {
  getStore("state.test.pair").getState().setA(42);
  const html = renderToString(<Probe />); // Probe 는 useSharedState("state.test.pair", s => s.a) 를 그대로 찍는다
  expect(html).toBe("1");
});
```

Task 1 시험과 같은 `declare module` 과 `createStore` 두 줄, `beforeEach(resetStores)` 를 둔다.

- [ ] **Step 2: 실패를 본다** — Run: `pnpm --filter @fortuna-lottery/store exec vitest run src/react.test.tsx`. Expected: FAIL, `./react` 를 찾지 못한다.

- [ ] **Step 3: `src/react.ts` 를 짓는다** — 첫 줄 `"use client";`. 몸체는 스펙 「React」 그대로다.

- [ ] **Step 4: 통과를 본다** — 같은 명령. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/store/src/react.ts packages/store/src/react.test.tsx
git commit -m "feat(store): 고른 값만 구독하는 useSharedState 를 더한다"
```

### Task 3: config 와 생성 함수

**Files:**
- Create: `packages/store/src/config.ts`
- Create: `packages/store/tools/codegen.cjs`
- Test: `packages/store/tools/codegen.test.mjs`
- Modify: `packages/store/package.json` (`test` 스크립트를 `vitest run && node --test tools`)

**Interfaces:**
- Produces (`@fortuna-lottery/store/config`): `type StoreTarget = "tsserver" | "next" | "cli"`, `interface StoreConfig { include?: string[]; out?: string; targets?: StoreTarget[] }`, `const defaults`, `defineConfig(config: StoreConfig): StoreConfig`
- Produces (`tools/codegen.cjs`, CommonJS):
  - `loadConfig(ts, fromDir: string): { root: string; out: string; match(file: string): boolean; enabled(target: StoreTarget): boolean }` — `root`·`out` 은 `/` 로 정규화한 절대 경로.
  - `collect(ts, program, config): { file: string; key: string; text: string }[]` — key 순 정렬.
  - `render(entries, config): string`
  - `generate(ts, config): boolean` — `config.root` 의 `tsconfig.json` 으로 프로그램을 짓고 `collect`·`render` 한 뒤 `writeIfChanged`. 썼으면 `true`.
  - `writeIfChanged(file: string, text: string): boolean`
  - `requireTypeScript(root: string)` — `createRequire(join(root, "package.json"))("typescript")`.

- [ ] **Step 1: 실패하는 시험을 쓴다**

각 시험은 `mkdtempSync` 로 임시 프로젝트를 짓는다. `package.json`(`{}`), `tsconfig.json`(`{"compilerOptions":{"strict":true,"module":"ESNext","moduleResolution":"Bundler","target":"ES2022","skipLibCheck":true,"paths":{"@fortuna-lottery/store":["<packages/store/src/index.ts 절대 경로>"]}},"include":["src"]}`)를 두고, TypeScript 는 `requireTypeScript(<apps/web 경로>)` 로 빌린다.

```js
test("config 파일이 없으면 기본값을 쓴다", () => {
  const config = loadConfig(ts, root);
  assert.equal(config.out, `${posix(root)}/src/store.gen.ts`);
  assert.equal(config.enabled("tsserver"), true);
  assert.equal(config.enabled("cli"), false);
  assert.equal(config.match(`${root}\\src\\a\\b.state.ts`), true); // 역슬래시 경로도 맞힌다
  assert.equal(config.match(`${root}/src/a/b.ts`), false);
});
test("store.config.ts 가 기본값 위에 얹히고 @fortuna-lottery/store/config 를 풀어 낸다", () => {
  write("store.config.ts", `import { defineConfig } from "@fortuna-lottery/store/config";
export default defineConfig({ out: "src/gen/x.gen.ts", targets: ["cli"] });`);
  const config = loadConfig(ts, root);
  assert.equal(config.out, `${posix(root)}/src/gen/x.gen.ts`);
  assert.equal(config.enabled("cli"), true);
  assert.equal(config.enabled("tsserver"), false);
});
test("문법이 깨진 config 는 파일 이름을 담아 실패한다", () => {
  write("store.config.ts", "export default {");
  assert.throws(() => loadConfig(ts, root), /store\.config\.ts/);
});
test("괄호·대괄호가 든 경로의 정의를 찾아 타입을 글자로 쓴다", () => {
  write("src/app/(home)/_state/combination.state.ts", `import { createStore } from "@fortuna-lottery/store";
createStore("state.home.combination", (set) => ({
  numbers: null as number[] | null,
  choose: (numbers: number[]) => set({ numbers }),
}));`);
  write("src/app/documents/[id]/_state/panel.state.ts", `import { createStore } from "@fortuna-lottery/store";
createStore("state.documents.[id].panel", (set, get) => ({ open: false, toggle: () => set({ open: !get().open }) }));`);
  generate(ts, loadConfig(ts, root));
  const out = read("src/store.gen.ts");
  assert.match(out, /^\/\/ 자동 생성 — @fortuna-lottery\/store 가 쓴다\. 고치지 않는다/);
  assert.match(out, /import "\.\/app\/\(home\)\/_state\/combination\.state";/);
  assert.match(out, /import "\.\/app\/documents\/\[id\]\/_state\/panel\.state";/);
  assert.match(out, /"state\.home\.combination": \{ numbers: number\[\] \| null; choose: \(numbers: number\[\]\) => void; \};/);
  assert.match(out, /"state\.documents\.\[id\]\.panel": \{ open: boolean; toggle: \(\) => void; \};/);
  assert.ok(out.indexOf('"state.documents') < out.indexOf('"state.home')); // key 순
});
test("export 한 이름 붙은 타입은 생성 파일 기준 상대 import 로 쓴다", () => {
  write("src/types.ts", "export type Pick = { id: string };");
  write("src/a/_state/last.state.ts", `import { createStore } from "@fortuna-lottery/store";
import type { Pick } from "../../types";
createStore("state.a.last", () => ({ last: null as Pick | null }));`);
  generate(ts, loadConfig(ts, root));
  assert.match(read("src/store.gen.ts"), /last: import\("\.\/types"\)\.Pick \| null/);
});
test("리터럴이 아닌 key·함수가 아닌 정의는 건너뛴다", () => {
  write("src/a/_state/odd.state.ts", `import { createStore } from "@fortuna-lottery/store";
const KEY = "state.a.odd";
createStore(KEY, () => ({ n: 0 }));`);
  generate(ts, loadConfig(ts, root));
  assert.doesNotMatch(read("src/store.gen.ts"), /state\.a\.odd/);
});
test("정의가 없으면 빈 StateTypes 를 쓴다", () => {
  generate(ts, loadConfig(ts, root));
  assert.match(read("src/store.gen.ts"), /interface StateTypes \{\n {2}\}/);
});
test("내용이 같으면 다시 쓰지 않는다", () => {
  const config = loadConfig(ts, root);
  assert.equal(generate(ts, config), true);
  assert.equal(generate(ts, config), false);
});
```

- [ ] **Step 2: 실패를 본다** — Run: `node --test packages/store/tools`. Expected: FAIL, `codegen.cjs` 가 없다.

- [ ] **Step 3: `src/config.ts` 와 `tools/codegen.cjs` 를 짓는다**

`config.ts` 는 스펙 「config」 그대로다. `codegen.cjs` 의 정해진 자리:
- `loadConfig`: 뿌리는 `ts.findConfigFile(fromDir, ts.sys.fileExists, "package.json")` 의 폴더다. config 를 `ts.transpileModule(…, { compilerOptions: { module: CommonJS }, fileName })` 로 바꾸고, 진단이 있거나 실행이 던지면 `store.config.ts: <원래 메시지>` 로 던진다. 실행 때 넘기는 `require` 는 `"@fortuna-lottery/store/config"` 에 `{ defineConfig: (c) => c }` 를 돌려주고 나머지는 프로젝트 뿌리 기준 `createRequire` 에 맡긴다.
- glob 변환: 경로를 `/` 로 바꾼 뒤 정규식 특수 문자를 이스케이프하고, `**/` 를 `(?:.*/)?` 로, 남은 `*` 를 `[^/]*` 로 바꾼다. 패턴들을 `^<root>/(?:a|b)$` 로 묶는다.
- `collect`: `program.getSourceFiles()` 중 `config.match` 에 맞는 것에서, 호출 대상이 식별자 `createStore` 이고 첫 인자가 `StringLiteral`·둘째 인자가 화살표 함수나 함수 표현식인 호출만 본다. 반환 타입은 `checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(fn))`, 글자는 `checker.typeToTypeNode(type, undefined, NoTruncation | UseFullyQualifiedType)` 를 `ts.createPrinter({ removeComments: true })` 로 찍은 것이다. 여러 줄이면 한 줄로 접는다.
- `render`: 줄 순서는 첫 줄 주석, `export {};`, 정의 파일마다 `import "<상대 경로>";`(확장자 `.ts` 를 뗀다, `./` 로 시작), 빈 줄, `declare module "@fortuna-lottery/store" {`, `  interface StateTypes {`, key 마다 `    "<key>": <text>;`, `  }`, `}`, 빈 줄. 타입 글자 안의 `import("<절대 경로>")` 는 생성 파일 기준 상대 경로로 바꾼다.

- [ ] **Step 4: 통과를 본다** — Run: `node --test packages/store/tools`. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/store
git commit -m "feat(store): config 를 읽고 정의의 상태 타입을 글자로 뽑는 생성 함수를 더한다"
```

### Task 4: CLI 와 Next 래퍼, 그리고 타입 끝단 시험

**Files:**
- Create: `packages/store/tools/cli.mjs`, `packages/store/tools/next.mjs`, `packages/store/tools/next.d.mts`
- Test: `packages/store/tools/cli.test.mjs`, `packages/store/tools/next.test.mjs`

**Interfaces:**
- Consumes: Task 3 의 `loadConfig`·`generate`·`requireTypeScript`.
- Produces: bin `store-gen`(인자 없음). `withStore<T>(nextConfig: T): (phase: string) => T` — `next.d.mts` 가 이 서명을 선언한다.

- [ ] **Step 1: 실패하는 시험을 쓴다**

`cli.test.mjs` 는 Task 3 과 같은 임시 프로젝트에서 `node <cli.mjs 경로>` 를 `cwd: root` 로 돌린다.

```js
test("cli 가 꺼져 있으면 건너뛴다는 한 줄을 남기고 0 으로 끝난다", () => {
  const r = run(); // config 없음 — 기본 targets 는 tsserver 뿐이다
  assert.equal(r.status, 0);
  assert.match(r.stdout, /store-gen: targets 에 cli 가 없어 건너뛴다/);
  assert.equal(existsSync(join(root, "src/store.gen.ts")), false);
});
test("cli 가 켜져 있으면 생성 파일을 쓴다", () => {
  write("store.config.ts", `export default { targets: ["cli"] };`);
  write("src/a/_state/count.state.ts", COUNT); // createStore("state.a.count", (set, get) => ({ n: 0, add: () => set({ n: get().n + 1 }) }))
  assert.equal(run().status, 0);
  assert.match(read("src/store.gen.ts"), /"state\.a\.count"/);
});
test("config 가 깨지면 파일 이름을 담아 0 이 아닌 값으로 끝난다", () => {
  write("store.config.ts", "export default {");
  const r = run();
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /store\.config\.ts/);
});
test("생성 뒤 tsc 가 없는 key·없는 필드·set 의 없는 필드를 잡는다", () => {
  write("store.config.ts", `export default { targets: ["cli"] };`);
  write("src/a/_state/count.state.ts", COUNT);
  write("src/use.ts", `import "./store.gen";
import { getStore, createStore } from "@fortuna-lottery/store";
// @ts-expect-error 없는 key
getStore("state.a.none");
// @ts-expect-error 없는 필드
getStore("state.a.count").getState().nope;
// @ts-expect-error set 의 없는 필드
createStore("state.a.count", (set) => ({ n: 0, add: () => set({ nope: 1 }) }));
const n: number = getStore("state.a.count").getState().n;`);
  assert.equal(run().status, 0);
  assert.equal(tsc(root).status, 0); // @ts-expect-error 가 하나라도 남으면 실패한다
});
test("생성 파일이 없으면 모든 key 가 never 다", () => {
  write("src/use.ts", `import { getStore } from "@fortuna-lottery/store";
// @ts-expect-error StateTypes 가 비면 key 가 never 다
getStore("state.a.count");`);
  assert.equal(tsc(root).status, 0);
});
```

`tsc(root)` 는 `apps/web` 의 TypeScript `bin/tsc` 를 `-p <root>/tsconfig.json --noEmit` 으로 돌린다.

`next.test.mjs`:

```js
test("next 가 켜져 있으면 설정을 읽을 때 생성하고 설정을 그대로 돌려준다", () => {
  write("store.config.ts", `export default { targets: ["next"] };`);
  write("src/a/_state/count.state.ts", COUNT);
  const config = { typedRoutes: true };
  assert.equal(inDir(root, () => withStore(config)("phase-production-build")), config);
  assert.match(read("src/store.gen.ts"), /"state\.a\.count"/);
});
test("next 가 꺼져 있으면 아무것도 쓰지 않는다", () => {
  write("src/a/_state/count.state.ts", COUNT);
  inDir(root, () => withStore({})("phase-production-build"));
  assert.equal(existsSync(join(root, "src/store.gen.ts")), false);
});
test("dev 에서는 정의 파일의 내용이 바뀌면 다시 쓴다", async () => {
  write("store.config.ts", `export default { targets: ["next"] };`);
  write("src/a/_state/count.state.ts", COUNT);
  inDir(root, () => withStore({})("phase-development-server"));
  write("src/a/_state/count.state.ts", COUNT.replace("n: 0", "n: 0, label: \"x\""));
  await waitFor(() => /label: string/.test(read("src/store.gen.ts")), 3000);
});
```

감시는 `globalThis` 표식으로 한 번만 걸리므로, dev 시험은 파일 안에서 마지막에 두고 시험이 끝나면 `process.exit` 없이 끝나도록 감시자를 `unref()` 한다.

- [ ] **Step 2: 실패를 본다** — Run: `node --test packages/store/tools`. Expected: 새 시험들이 FAIL.

- [ ] **Step 3: `cli.mjs`·`next.mjs`·`next.d.mts` 를 짓는다**

`cli.mjs` 첫 줄은 `#!/usr/bin/env node`. 뿌리 찾기·TypeScript 빌리기·켜짐 판정은 Task 3 함수를 쓴다. config 오류는 `console.error(err.message)` 후 `process.exit(1)`. `next.mjs` 는 스펙 「도구 셋」의 `withStore` 그대로이고, 감시는 `fs.watch(<root>/src, { recursive: true })` 를 200 ms 묶어 `config.match` 에 맞는 파일에만 `generate` 하며, 감시자를 `unref()` 한다.

- [ ] **Step 4: 통과를 본다** — Run: `node --test packages/store/tools`. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/store/tools
git commit -m "feat(store): store-gen 과 withStore 로 디스크에 생성 파일을 쓴다"
```

### Task 5: tsserver 플러그인

**Files:**
- Create: `packages/store/tools/plugin.cjs`
- Test: `packages/store/tools/plugin.test.mjs`

**Interfaces:**
- Consumes: Task 3 의 `loadConfig`·`collect`·`render`·`writeIfChanged`.
- Produces: `module.exports = function init({ typescript }) { return { create(info) } }` — tsconfig 의 `plugins` 에는 `{ "name": "@fortuna-lottery/store/tools/plugin.cjs" }` 로 건다. tsserver 는 플러그인을 exports 를 보지 않는 Node10 해석으로 찾으므로 파일 경로로 적는다.

- [ ] **Step 1: 실패하는 시험을 쓴다**

임시 프로젝트에 `ts.createLanguageService(host)` 를 짓는다. `host` 는 메모리의 파일 판본표를 갖는 최소 호스트다. `info = { languageServiceHost: host, languageService, project: { getCurrentDirectory: () => root, projectService: { logger: { info() {} } } } }` 로 `init({ typescript: ts }).create(info)` 를 부른다.

```js
test("정의를 고치면 다음 진단에서 새 필드를 알고 생성 파일을 디스크에도 쓴다", () => {
  write("store.config.ts", `export default { targets: ["tsserver"] };`);
  write("src/a/_state/count.state.ts", COUNT);
  write("src/use.ts", `import "./store.gen";
import { getStore } from "@fortuna-lottery/store";
export const label = getStore("state.a.count").getState().label;`);
  const ls = createPluggedService(root);
  assert.ok(diagnostics(ls, "src/use.ts").some((d) => /label/.test(d)));
  edit("src/a/_state/count.state.ts", COUNT.replace("n: 0", "n: 0, label: \"x\""));
  settle(ls); // 판본이 따라잡도록 진단을 두 번 돈다 — 플러그인은 직전 프로그램으로 짓는다
  assert.deepEqual(diagnostics(ls, "src/use.ts"), []);
  assert.match(readFileSync(join(root, "src/store.gen.ts"), "utf8"), /label: string/);
});
test("tsserver 가 꺼져 있으면 언어 서비스를 그대로 돌려준다", () => {
  write("store.config.ts", `export default { targets: ["cli"] };`);
  const { info, returned } = createWithInfo(root);
  assert.equal(returned, info.languageService);
});
test("config 가 깨져도 언어 서비스를 그대로 돌려주고 로그를 남긴다", () => {
  write("store.config.ts", "export default {");
  const logs = [];
  const { info, returned } = createWithInfo(root, logs);
  assert.equal(returned, info.languageService);
  assert.ok(logs.some((l) => /store\.config\.ts/.test(l)));
});
test("역슬래시로 물어도 생성 파일로 알아본다", () => {
  write("src/a/_state/count.state.ts", COUNT);
  const { host } = createWithInfo(root);
  const snapshot = host.getScriptSnapshot(`${root}\\src\\store.gen.ts`.replaceAll("/", "\\"));
  assert.match(snapshot.getText(0, snapshot.getLength()), /"state\.a\.count"/);
});
```

- [ ] **Step 2: 실패를 본다** — Run: `node --test packages/store/tools/plugin.test.mjs`. Expected: FAIL.

- [ ] **Step 3: `plugin.cjs` 를 짓는다**

`create(info)` 는 `loadConfig` 를 `try` 로 감싸 실패하면 `info.project.projectService.logger.info("[@fortuna-lottery/store] " + 메시지)` 를 남기고 `info.languageService` 를 돌려준다. `tsserver` 가 꺼져 있어도 그대로 돌려준다. 켜져 있으면 호스트의 `getScriptVersion`·`getScriptSnapshot` 을 감싼다. 「config.out 인가」는 두 경로를 `/` 로 바꾸고 소문자로 비교한다(Windows). 내용 짓기는 `info.languageService.getProgram()` 으로 `collect`·`render` 하고, 짓는 동안 다시 들어오면 앞 내용을 준다. 내용이 바뀌면 판본 숫자를 올리고 `writeIfChanged(config.out, text)` 한다.

- [ ] **Step 4: 통과를 본다** — Run: `node --test packages/store/tools`. Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/store/tools
git commit -m "feat(store): 편집 중에 생성 파일을 채우는 tsserver 플러그인을 더한다"
```

### Task 6: apps/web 을 새 패키지로 옮긴다

**Files:**
- Create: `apps/web/store.config.ts`, `apps/web/vitest.store-gen.ts`, `apps/web/src/test.setup.ts`, `apps/web/.gitignore`(없으면 만든다), `.vscode/settings.json`
- Modify: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `.gitignore`, `turbo.json`, `.dependency-cruiser.cjs`
- Modify: `apps/web/src/app/(home)/_state/combination.state.ts`, `apps/web/src/app/(home)/_state/generatorOpen.state.ts`, `apps/web/src/app/(home)/index.ts`, `apps/web/src/composition/screens.ts`
- Modify: presenter 일곱 — `apps/web/src/app/(home)/{Home,GeneratorCard/GeneratorCard,HypothesisLab/HypothesisLab,LotterietusCard/LotterietusCard,PicksCard/PicksCard,SimulationCard/SimulationCard,StatisticsPanel/StatisticsPanel}.presenter.ts`
- Modify: 시험 여섯 — `apps/web/src/app/(home)/{Home,GeneratorCard/GeneratorCard,HypothesisLab/HypothesisLab,LotterietusCard/LotterietusCard,PicksCard/PicksCard,StatisticsPanel/StatisticsPanel}.presenter.test.ts`
- Remove: `apps/web/src/framework/areas/state.area.ts`, `apps/web/src/shared/lib/store/state.ts` 와 그 쓰임(`framework/index.ts` 의 state 갈래, `framework/react.tsx` 의 `useStoreState`, `shared/lib/store/index.ts` 의 재수출, `shared/lib/store-react/bindReact.tsx` 의 `useStoreState` 와 그 시험)

**Interfaces:**
- Consumes: `@fortuna-lottery/store` 의 `createStore`·`getStore`·`resetStores`, `@fortuna-lottery/store/react` 의 `useSharedState`, `@fortuna-lottery/store/config` 의 `defineConfig`, `@fortuna-lottery/store/next` 의 `withStore`, bin `store-gen`.
- Produces: 생성 파일 `apps/web/src/composition/store.gen.ts`(git 무시). 상태 모양 — `state.home.combination: { numbers: number[] | null; choose(numbers: number[]): void }`, `state.home.generatorOpen: { open: boolean; toggle(): void }`.

- [ ] **Step 1: 시험을 먼저 새 모양으로 고친다**

시험 여섯에서 `container.resolve("state.home.combination").actions.choose(x)` 를 `getStore("state.home.combination").getState().choose(x)` 로, `container.resolve("state.home.generatorOpen").actions.toggle()` 을 `getStore("state.home.generatorOpen").getState().toggle()` 로 바꾼다. `Home.presenter.test.ts` 의 「컨테이너마다 공통 상태가 따로다」를 아래로 바꾼다.

```ts
it("resetStores 뒤에는 공통 상태가 처음 값이다", () => {
  getStore("state.home.combination").getState().choose([1, 2, 3, 4, 5, 6]);
  resetStores();
  expect(getStore("state.home.combination").getState().numbers).toBeNull();
});
```

- [ ] **Step 2: 실패를 본다** — Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/app`. Expected: FAIL, `@fortuna-lottery/store` 를 찾지 못한다.

- [ ] **Step 3: 배선한다**

- `package.json`: 의존성 `"@fortuna-lottery/store": "workspace:*"`. `"typecheck": "store-gen && tsc --noEmit"`. 뿌리 `package.json` 의 `lint:deps` 앞에 `pnpm --filter @fortuna-lottery/web exec store-gen && ` 을 붙인다.
- `store.config.ts`: `defineConfig({ out: "src/composition/store.gen.ts", targets: ["tsserver", "next", "cli"] })` 와 스펙의 주석.
- `next.config.ts`: `export default withStore(nextConfig)`.
- `tsconfig.json`: `plugins` 에 `{ "name": "@fortuna-lottery/store/tools/plugin.cjs" }`.
- `vitest.config.ts`: `test.globalSetup: ["./vitest.store-gen.ts"]`, `test.setupFiles: ["./src/test.setup.ts"]`. `vitest.store-gen.ts` 의 기본 내보내기는 `execSync("pnpm exec store-gen", { cwd: __dirname, stdio: "inherit" })` 한 번이다.
- `src/test.setup.ts`: `import "@composition/screens";` 와 `afterEach(() => resetStores());`.
- `apps/web/.gitignore`: `src/composition/store.gen.ts`. 뿌리 `.gitignore`: `!.vscode/settings.json`.
- `.vscode/settings.json`: `{ "typescript.tsdk": "apps/web/node_modules/typescript/lib", "typescript.enablePromptUseWorkspaceTsdk": true }`.
- `turbo.json`: `typecheck` 에 `"outputs": ["src/composition/store.gen.ts"]`.
- `.dependency-cruiser.cjs`:
  - 89 줄의 `no-deep-screen-or-widget-import`(조립 루트의 나머지 파일) `from.pathNot` 을 `'^apps/web/src/composition/(screens|routes|store\\.gen)\\.ts$'` 로 넓힌다.
  - 새 규칙 `store-gen-imports-state-only`: from `^apps/web/src/composition/store\\.gen\\.ts$`, to `^apps/web/src/(app|widgets)/`, `pathNot: '/(_state|state)/[^/]+\\.state\\.ts$'`.
  - `nothing-reaches-composition` 첫 벌의 `from.pathNot` 에 `'^apps/web/src/test\\.setup\\.ts$'` 를 더한다.
  - 새 규칙 `api-must-not-reach-store`: from `^apps/api/`, to `^packages/store/`. 새 규칙 `store-package-reaches-nothing-local`: from `^packages/store/`, to `^(apps|packages)/`, `pathNot: '^packages/store/'`.
  - `tools/checks/violations/` 에 세 새 규칙의 위반 표본을, `tools/checks/allowed/` 에 `no-deep-screen-or-widget-import--store-gen`(생성 파일이 `_state/*.state.ts` 를 import)과 `nothing-reaches-composition--test-setup` 허용 표본을 둔다. 기존 표본의 꼴을 따른다.

- [ ] **Step 4: 정의 파일·등록·presenter 를 옮긴다**

- 정의 파일 둘은 스펙 「apps/web 이 바뀌는 것」의 코드 그대로다(문서 주석은 지금 것을 지킨다).
- `composition/screens.ts` 맨 위에 `import "./store.gen"; // state 등록 — 생성 파일이 모든 정의 파일을 싣는다`. `app/(home)/index.ts` 에서 `_state` import 두 줄을 지운다.
- presenter 일곱: `useStoreState(key)` 의 `[값, 묶음]` 을 `useSharedState(key, (s) => s.<필드>)` 로 바꾼다. 값은 `numbers`·`open`, 바꾸는 함수는 `choose`·`toggle` 이다. 예를 들어 `const [numbers, combination] = useStoreState("state.home.combination")` 와 `combination.choose(x)` 는 `const numbers = useSharedState("state.home.combination", (s) => s.numbers)`, `const choose = useSharedState("state.home.combination", (s) => s.choose)`, `choose(x)` 가 된다.
- 옛 state 갈래를 걷어낸다(Files 의 Remove 목록). `framework/index.ts` 의 `KeyOf` 유니언에서 `"state"` 는 남겨도 되지만 쓰이지 않으면 지운다. `Built.resolve` 의 key 유니언에서 `KeyOf<"state">` 를 뺀다.

- [ ] **Step 5: 통과를 본다**

Run: `pnpm --filter @fortuna-lottery/store build && pnpm --filter @fortuna-lottery/web typecheck && pnpm --filter @fortuna-lottery/web test && pnpm lint:deps && bash tools/checks/run-violations.sh`
Expected: 모두 통과. `store.describe` 스냅숏 시험 하나만 실패해도 된다(Task 8 이 고친다). 그 밖의 실패는 이 과업 안에서 고친다.

- [ ] **Step 6: 커밋**

```bash
git add -A apps/web packages .gitignore .vscode/settings.json turbo.json .dependency-cruiser.cjs package.json tools/checks pnpm-lock.yaml
git commit -m "refactor(web): 공통 상태를 @fortuna-lottery/store 로 옮기고 옛 state 영역을 걷어낸다"
```

### Task 7: ESLint state 규칙을 새 호출에 맞춘다

**Files:**
- Modify: `apps/web/eslint.config.mjs`
- Modify: `tools/checks/eslint-violations/{state-key-literal,state-key-matches-folder,state-key-matches-folder--extra-segment,state-key-within-scope,state-only-in-presenter,state-registers-in-state-folder,hook-resolves-own-key-only--state,no-renamed-store-import}/**`, `tools/checks/eslint-allowed/{state-key-matches-folder--route-group,state-key-within-scope--ancestor,state-only-in-presenter--presenter}/**`
- Modify: `tools/checks/run-violations.sh` (EXPECT 표에 새 표본이 있으면)

**Interfaces:**
- Consumes: 호출 이름 `createStore`(출처 `@fortuna-lottery/store`), `useSharedState`(출처 `@fortuna-lottery/store/react`).

- [ ] **Step 1: 위반 표본을 새 호출로 고친다**

표본마다 `declare function useStoreState…` 를 `import { useSharedState } from "@fortuna-lottery/store/react";` 로, `store.state("…", …)` 를 `import { createStore } from "@fortuna-lottery/store";` 와 `createStore("…", …)` 로 바꾼다. 새 위반 표본 둘을 더한다.
- `no-renamed-store-import--state`: `import { useSharedState as useS } from "@fortuna-lottery/store/react";`.
- `store-registers-at-top-level--create-store`: 함수 안에서 `createStore(…)` 를 부른다.
허용 표본 하나를 더한다: `state-key-literal--engine-create-store` — `framework/index.ts` 꼴로 `@lib/store` 에서 가져온 `createStore(areas)` 를 부른다(첫 인자가 문자열이 아니어도 울지 않아야 한다).

- [ ] **Step 2: 표본이 기대대로 실패·통과하지 않는지 본다** — Run: `bash tools/checks/run-violations.sh`. Expected: 고친 state 위반 표본들이 `FAIL … 걸리지 않았다` 로 나온다.

- [ ] **Step 3: 규칙을 고친다**

- 파일마다 `@fortuna-lottery/store` 에서 가져온 지역 이름이 `createStore` 인지 `ImportDeclaration` 으로 모은다. `storeCall(node, ["state"])` 를 쓰던 자리는 「그 파일이 `@fortuna-lottery/store` 에서 가져온 `createStore` 호출」로, `hookCall(node, "useStoreState")` 는 `hookCall(node, "useSharedState")` 로 바꾼다.
- `no-renamed-store-import` 의 출처 정규식을 `^(@framework(\/react)?|@fortuna-lottery\/store(\/react)?)$` 로 넓힌다.
- `STORE_REGISTER_NESTED` 선택자에 `CallExpression[callee.name='createStore']:not(Program > ExpressionStatement > CallExpression)` 갈래를 더한다.
- `hook-resolves-own-key-only` 의 state 문구를 `공통 상태는 presenter 가 useSharedState 로 꺼낸다 — useStore 로 꺼내지 않는다 (hook-resolves-own-key-only)` 로 고친다.
- `STATE_FILES` 를 `["src/app/**/_state/*.state.ts", "src/widgets/**/state/*.state.ts"]` 로 좁힌다.

- [ ] **Step 4: 통과를 본다** — Run: `bash tools/checks/run-violations.sh && pnpm --filter @fortuna-lottery/web lint`. Expected: 모든 표본 `OK`, lint 위반 0.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/eslint.config.mjs tools/checks
git commit -m "chore(lint): state 규칙이 createStore·useSharedState 를 알아보게 한다"
```

### Task 8: 출력 스냅숏의 state 절

**Files:**
- Modify: `apps/web/src/framework/describe.ts`
- Modify: `apps/web/src/composition/__snapshots__/store.describe.test.ts.snap`(다시 쓴다)

**Interfaces:**
- Consumes: `registeredKeys()`, `getStore(key).getInitialState()`.
- Produces: `describeWithUsage(): string` — `[state]` 절을 맨 앞에 두고 그 뒤에 `store.describe()` 를 잇는다.

- [ ] **Step 1: 기대 출력을 시험에 고정한다**

`store.describe.test.ts` 에 다음을 더한다(스냅숏과 별개로 꼴을 고정한다).

```ts
it("state 절은 key 마다 처음 값·바꾸는 함수·정의·쓰는 곳을 찍는다", () => {
  const lines = describeWithUsage().split("\n");
  expect(lines.slice(0, 9)).toEqual([
    "[state]",
    'state.home.combination = {"numbers":null}',
    "  바꾸는 함수: choose",
    "  정의: app/(home)/_state/combination.state.ts",
    "  쓰는 곳: GeneratorCard, HypothesisLab, PicksCard, SimulationCard, StatisticsPanel",
    'state.home.generatorOpen = {"open":false}',
    "  바꾸는 함수: toggle",
    "  정의: app/(home)/_state/generatorOpen.state.ts",
    "  쓰는 곳: Home, LotterietusCard",
  ]);
});
```

- [ ] **Step 2: 실패를 본다** — Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/composition/store.describe.test.ts`. Expected: FAIL.

- [ ] **Step 3: `describe.ts` 를 고친다**

정의 자리는 `*.state.ts` 파일에서 `createStore\(\s*"([^"]+)"` 로, 쓰는 곳은 `*.presenter.ts(x)` 에서 `useSharedState\(\s*"([^"]+)"` 로 찾는다(presenter 이름은 파일 이름에서 `.presenter.ts(x)` 를 뗀 것, 정렬·중복 제거). 처음 값은 `getInitialState()` 의 함수가 아닌 필드만 모은 객체의 `JSON.stringify`, 바꾸는 함수는 함수인 필드 이름을 정렬해 `, ` 로 잇는다. 옛 `[state]` 처리 코드(`state.` 줄 뒤에 덧붙이던 것)는 지운다.

- [ ] **Step 4: 통과를 보고 스냅숏을 다시 쓴다** — Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/composition/store.describe.test.ts -u`. Expected: PASS. 스냅숏 diff 가 `[state]` 절에만 있는지 눈으로 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/framework/describe.ts apps/web/src/composition
git commit -m "refactor(web): 출력 스냅숏의 state 절을 새 등록부에서 짓는다"
```

### Task 9: 문서와 마무리 검증

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/reports/2026-10-13-vault-feedback.md`

- [ ] **Step 1: CLAUDE.md 를 고친다**

- 뼈대 트리에 `packages/store/   @fortuna-lottery/store — key 로 등록하는 전역 공통 상태와 타입 생성기(tsserver·Next·CLI). apps/web 만 참조한다` 를 더한다.
- 명령어 절에 `pnpm --filter @fortuna-lottery/web exec store-gen   # 공통 상태 생성 파일(src/composition/store.gen.ts)을 쓴다. typecheck·lint:deps·vitest 가 먼저 부른다` 를 더한다.
- 「자식 뷰가 함께 쓰는 상태 둘」·「state 의 등록부 값은 정의 자체다」·「store 엔진은 …」 절을 고친다: 공통 상태는 `@fortuna-lottery/store` 의 전역 등록부에 있고 공급자가 없다, 정의는 `createStore("key", (set, get) => …)` 하나이고 타입은 생성 파일의 `StateTypes` 가 준다, presenter 는 `useSharedState(key, select)` 로 꺼낸다, 시험은 `getStore` 로 미리 정하고 `afterEach` 의 `resetStores` 가 되돌린다, cache·http·event·route 는 아직 옛 store 에 있다(1단계).
- 편집기 안내: VS Code 는 작업 공간 TypeScript 를 써야 플러그인이 실린다.

- [ ] **Step 2: 보고 문서에 한 줄 올린다** — 기존 항목의 번호·꼴을 따라, 「state 가 규약 층의 store 영역을 떠나 독립 패키지 `@fortuna-lottery/store` 가 되었다(공급자 없음, 타입 생성기). frontend-store §2·§3 과 frontend-shared-state 가 아직 옛 모양을 적는다」를 더한다.

- [ ] **Step 3: 전체 검증** — Run: `pnpm check && bash tools/checks/run-violations.sh`. Expected: 모두 통과.

- [ ] **Step 4: 편집기에서 한 번 확인한다** — VS Code 에서 「TypeScript: Select TypeScript Version → Use Workspace Version」을 고른 뒤, `_state/` 에 새 `*.state.ts` 를 만들고 presenter 에서 그 key 가 저장 없이 자동완성되는지, `src/composition/store.gen.ts` 가 디스크에 쓰였는지 본다. 결과를 커밋 메시지나 PR 본문에 적는다. 실리지 않으면 tsserver 로그(`TypeScript: Open TS Server log`)에서 `[@fortuna-lottery/store]` 줄을 찾아 원인을 적고 멈춘다.

- [ ] **Step 5: 커밋**

```bash
git add CLAUDE.md docs/superpowers/reports/2026-10-13-vault-feedback.md
git commit -m "docs: 공통 상태 1단계를 CLAUDE.md 와 vault 보고에 적는다"
```
