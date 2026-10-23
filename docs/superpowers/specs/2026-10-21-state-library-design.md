# 공통 상태 라이브러리 — 1단계 설계

작성일: 2026-10-21. 대상: 새 패키지 `packages/store`(`@fortuna-lottery/store`)와 `apps/web` 의 공통 상태.

## 의도

store 를 들인 처음 이유는 **정의를 한눈에 보는 것**이었다. 정의를 파일 하나에 다 두면 그 파일이 쉽게
비대해진다. 그래서 정의는 쓰는 자리에 흩어 두고 key 로 등록하고, 앱이 그것을 모아 쓰는 방식으로 바꿨다.
그 흐름에 state 도 함께 올렸다.

그런데 지금 구현은 그 원칙보다 무겁다. 값 하나가 화면에 닿기까지 영역 객체(`prefix`·`check`·`build`·
`attach`), di 컨테이너, 규약 층의 손 래퍼, `StoreProvider` 의 `resolve(key)` 를 차례로 지난다. key 의 첫
마디가 이미 영역을 말하는데도 영역 이름을 세 자리(영역 객체의 key, `prefix`, 등록 함수 이름)에 다시 적는다.
정의 파일마다 `declare module` 로 key 를 한 번 더 적는다.

이 개정은 단계로 나눈다. **1단계는 state 만 다룬다.** 목표는 zustand 처럼 쓰는 순수 상태 라이브러리다.

- 정의 파일은 `createStore("key", creator)` 한 번만 부른다. key 는 그 자리에 한 번만 적는다.
- 공급자도 컨테이너도 없다. 등록하면 곧 쓸 수 있다.
- 타입은 사람이 적지 않는다. 생성기가 정의에서 상태 타입을 뽑아 key 와 함께 등록부 타입에 올린다.
- 라이브러리는 이 저장소의 폴더 규약을 모른다. 다른 프로젝트에서도 그대로 쓰도록 root 의 `packages/` 에
  두고, 어느 파일이 정의 파일인지는 쓰는 프로젝트가 config 로 알려 준다(tailwind 의 `content` 와 같은 구조).

## 목표

- `packages/store` 에 `@fortuna-lottery/store` 를 세운다. 런타임(`createStore`·`getStore`·`resetStores`·
  `registeredKeys`·`useSharedState`), config(`defineConfig`), 생성기(tsserver 플러그인·Next 래퍼·CLI)를 갖는다.
- `apps/web` 의 공통 상태 둘(`state.home.combination`·`state.home.generatorOpen`)을 이 패키지로 옮긴다.
- 기존 store(`@lib/store`·`@framework`)에서 state 영역을 걷어낸다.
- `pnpm check` 가 통과한다.

## 하지 않는 것

- **cache·http·event·route 는 건드리지 않는다.** 지금 store(`@lib/store`·`@framework`)와 `StoreProvider` 에
  그대로 남는다. 다음 단계에서 다룬다.
- **vault 골조 문서는 고치지 않는다.** 단계가 다 끝난 뒤 한 번에 개정한다. 그 사이 이 저장소는 vault 문서와
  어긋난다. 어긋남은 [보고 문서](../reports/2026-10-13-vault-feedback.md)에 한 줄로 올린다.
- **zustand 를 의존성으로 들이지 않는다.** 모양만 따르고 직접 짓는다.
- 공급자로 상태를 나누는 기능(라우트마다, 요청마다 따로 서는 상태)은 두지 않는다.

## 다음 단계로 넘기는 것

1단계 대화에서 나왔지만 state 밖의 일이라 여기서 하지 않는 방향 둘을 적어 둔다.

- **영역은 등록된 key 만으로 가른다.** key 의 첫 마디(`cache.`·`http.`·`event.`·`route.`)가 이미 영역을 말하므로,
  영역 이름을 객체 key·`prefix`·등록 함수 이름에 다시 적는 지금 구조를 걷어낸다.
- **컨테이너 주입 과정을 더 단순하게 한다.** 영역 정의의 `build`·`attach`, di 컨테이너, `StoreProvider` 의
  `resolve(key)` 로 이어지는 중간 단계를 줄인다.

## 실패로 보는 것

- 정의를 한 파일로 모으게 되는 것. 사람이 목록 파일을 고쳐야 새 상태가 쓰이는 것.
- 정의 파일에 key 나 상태 타입을 두 번 적어야 하는 것.
- 타입 검사가 조용히 꺼지는 것. 생성 파일이 없거나 낡았을 때 상태 타입이 `any`·`unknown` 으로 흘러가는 것.
- 시험끼리 상태가 섞이는 것.
- 라이브러리가 `_state/` 같은 이 저장소의 폴더 이름을 아는 것.

## 결정

### 상태는 전역이고 공급자가 없다

key 가 정의 자리를 정하고 닿는 범위는 ESLint 가 이미 막는다. 그래서 공급자에 남는 일은 「인스턴스를 따로
세우는 것」 하나다. 이것을 버리고 zustand 처럼 전역 등록부 하나에 상태를 둔다. 대가는 셋이다.

- **시험끼리 상태가 섞인다.** `resetStores()` 를 vitest 의 `afterEach` 에서 불러 막는다.
- **서버에서는 요청끼리 같은 상태를 본다.** 지금 state 는 사건 처리기에서만 바뀌고 서버 렌더는 처음 값만
  읽으므로 문제가 없다. 「서버 렌더 중에 `set` 을 부르지 않는다」를 규칙으로 적는다.
- **상태가 라우트를 떠나도 남는다.** 화면 모듈이 하나라 지금은 차이가 없다. 필요해지면 그때 초기화 길을 더한다.

### 타입은 생성기가 글자로 쓴다

TypeScript 는 함수 호출의 효과로 다른 파일의 타입을 넓히지 못한다. 그래서 key 와 상태 타입을 잇는 등록부
타입(`StateTypes`)은 누군가 선언해야 한다. 이 선언을 생성기가 쓴다.

생성기는 정의 파일의 `typeof` 를 참조하지 않는다. 그렇게 하면 「등록부 → 정의 파일의 반환 → creator 의 `set`
타입 → 등록부」로 순환이 생기고 TypeScript 가 `TS7022` 로 거절한다(시험으로 확인했다). 대신 TypeScript 컴파일러
API 로 creator 가 돌려주는 객체의 타입을 뽑아 **글자 그대로** 쓴다. 그래서 순환이 없고, 정의 파일은 상태 타입
선언도 처음 값 인자도 없이 쓴다. creator 안의 `set({ 없는필드: 1 })` 도 검사가 잡는다(시험으로 확인했다).

### 생성은 세 자리에서 하고 config 가 고른다

- **`tsserver`**: 편집기 안의 플러그인이 생성기 노릇을 한다. 편집 중인 프로그램으로 가상 선언을 채워 타건마다
  타입을 준다. 내용이 바뀌면 생성 파일을 디스크에도 쓴다.
- **`next`**: `withStore` 가 `next dev`·`next build` 에서 설정을 읽을 때 한 번 쓰고, `dev` 에서는 감시한다.
  편집기 없이 정의 파일이 바뀌는 경우(`git pull`, 다른 편집기)를 맡는다.
- **`cli`**: `store-gen` 이 쓴다. `typecheck`·vitest·CI 처럼 Next 도 편집기도 없는 자리다.

`tsc` 와 `next build` 는 tsserver 플러그인을 싣지 않는다. 그래서 CI 를 지키려면 디스크 생성(`next`·`cli`)이
반드시 있어야 하고, 플러그인은 그 위에 편집기의 즉시성만 더한다.

## 설계

### 패키지 구조

```
packages/store/                      @fortuna-lottery/store — 폴더 규약을 모른다
  package.json
  tsconfig.json
  vitest.config.ts
  src/                               tsc 로 dist/ 에 빌드한다
    index.ts                         createStore · getStore · resetStores · registeredKeys · 타입
    index.test.ts
    react.ts                         useSharedState                     ("@fortuna-lottery/store/react")
    react.test.tsx
    config.ts                        defineConfig · StoreConfig · defaults ("@fortuna-lottery/store/config")
  tools/                             빌드하지 않는 JS — 편집기와 Node 가 바로 싣는다
    codegen.cjs                      config 읽기 · 정의 찾기 · 타입 글자 뽑기 · 생성 파일 짓기
    codegen.test.mjs
    cli.mjs                          store-gen                          (bin)
    next.mjs                         withStore(nextConfig)              ("@fortuna-lottery/store/next")
    plugin.cjs                       tsserver 플러그인                   ("@fortuna-lottery/store/plugin")
```

`package.json`:

```jsonc
{
  "name": "@fortuna-lottery/store",
  "private": true,
  "type": "module",
  "bin": { "store-gen": "./tools/cli.mjs" },
  "exports": {
    ".":        { "types": "./dist/index.d.ts",  "import": "./dist/index.js" },
    "./react":  { "types": "./dist/react.d.ts",  "import": "./dist/react.js" },
    "./config": { "types": "./dist/config.d.ts", "import": "./dist/config.js" },
    "./next":   "./tools/next.mjs",
    "./plugin": "./tools/plugin.cjs"
  },
  "scripts": { "build": "tsc -p tsconfig.json", "test": "vitest run && node --test tools", "typecheck": "tsc -p tsconfig.json --noEmit" },
  "peerDependencies": { "react": ">=18", "typescript": ">=5.4" },
  "peerDependenciesMeta": { "react": { "optional": true } }
}
```

`contract`·`kernel` 처럼 `src/` 를 `dist/` 로 빌드해 내보낸다. TypeScript 는 peer 다. 생성기와 플러그인은 쓰는
프로젝트의 TypeScript 를 빌려 쓴다(플러그인은 tsserver 가 넘겨주는 것을, CLI·Next 래퍼는 프로젝트 뿌리에서
`createRequire` 로 찾은 것을 쓴다). `NoInfer` 를 쓰지 않으므로 5.4 는 넉넉한 하한이다.

### 런타임 — `src/index.ts`

React 를 import 하지 않는다.

```ts
export type SetState<T> = (partial: Partial<T> | ((now: T) => Partial<T>)) => void;
export type GetState<T> = () => T;

export interface StoreApi<T> {
  getState(): T;
  getInitialState(): T;
  setState: SetState<T>;
  subscribe(listener: () => void): () => void;
}

/** key → 상태 타입. 생성 파일이 글자로 덧붙인다. 사람이 쓰지 않는다 */
export interface StateTypes {}

// 생성 파일이 없으면 key 가 never 다 — 검사가 조용히 꺼지지 않고 모든 호출이 실패한다
export type StateKey = keyof StateTypes & string;
export type StateOf<K> = K extends StateKey ? StateTypes[K] : unknown;

/** key 로 등록하고 곧 짓는다. set·get 의 타입은 생성된 StateTypes 에서 온다 */
export function createStore<K extends string>(
  key: K,
  definition: (set: SetState<StateOf<K>>, get: GetState<StateOf<K>>) => object,
): void;

/** 등록된 상태 하나 — 등록되지 않은 key 면 `등록되지 않은 key 다: <key>` 로 실패한다 */
export function getStore<K extends StateKey>(key: K): StoreApi<StateOf<K>>;

/** 모든 상태를 처음 값으로 되돌린다. 구독자는 남기고 알린다 — 시험 사이에 부른다 */
export function resetStores(): void;

/** 등록된 key 전부, 정렬해서 — 출력 스냅숏이 쓴다 */
export function registeredKeys(): string[];
```

동작:

- **등록부는 모듈 안의 `Map<string, Entry>` 하나다.** `Entry` 는 `StoreApi` 와 `reset(next?)` 를 갖는다.
  `reset` 은 creator 를 다시 불러 상태와 처음 값을 바꾸고 구독자를 부른다. 구독자 집합은 그대로 둔다.
- **`createStore` 는 등록과 동시에 짓는다.** 같은 key 를 다시 등록하면 `NODE_ENV === "production"` 에서는
  `같은 key 를 두 번 등록했다: <key>` 로 실패하고, 그 밖(Fast Refresh·HMR·시험)에서는 새 정의로 `reset` 한다.
- **`setState` 는 zustand 와 같다.** 함수면 지금 값으로 부른다. 결과가 지금 값과 `Object.is` 로 같으면 아무것도
  하지 않는다. 다르면 `Object.assign({}, now, partial)` 로 새 객체를 짓고 구독자를 부른다.

### React — `src/react.ts`

```ts
"use client";
/** 선택자가 고른 값만 구독한다. 고른 값이 Object.is 로 바뀔 때만 다시 그린다. 서버 렌더는 처음 값이다 */
export function useSharedState<K extends StateKey, U>(key: K, select: (state: StateOf<K>) => U): U {
  const store = getStore(key);
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.getState()),
    () => select(store.getInitialState()),
  );
}
```

선택자는 필수다. 새 객체를 돌려주는 선택자는 무한 갱신을 부르므로 값 하나나 함수 하나를 고른다.

### config — `src/config.ts`

```ts
export type StoreTarget = "tsserver" | "next" | "cli";

export interface StoreConfig {
  /** 정의 파일을 고르는 glob — config 파일 기준. * 는 경로 마디 하나, ** 는 마디 여럿. 기본값 ["src/**/*.state.ts"] */
  include?: string[];
  /** 생성 파일 자리 — config 파일 기준. 기본값 "src/store.gen.ts" */
  out?: string;
  /** 생성을 맡는 자리. 기본값 ["tsserver"] */
  targets?: StoreTarget[];
}

export const defaults = { include: ["src/**/*.state.ts"], out: "src/store.gen.ts", targets: ["tsserver"] };

export function defineConfig(config: StoreConfig): StoreConfig {
  return config;
}
```

config 파일은 프로젝트 뿌리(`package.json` 이 있는 폴더)의 `store.config.ts` 다. 없으면 기본값만 쓴다.

### 생성기 — `tools/codegen.cjs`

플러그인이 CommonJS 여야 하므로 이 파일도 CommonJS 다. 내보내는 것은 셋이다.

- **`loadConfig(ts, fromDir)`**: 프로젝트 뿌리를 찾고 `store.config.ts` 를 `ts.transpileModule` 로 CommonJS 로 바꿔
  싣는다(편집기 Node 판본과 상관없이 돈다). 변환된 코드가 부르는 `require` 는 감싼 것을 넘긴다:
  `@fortuna-lottery/store/config` 를 부르면 `{ defineConfig: (c) => c }` 를 돌려주고, 그 밖은 실제 `require` 에 맡긴다.
  패키지 dist 는 ESM 이라 CommonJS 로 바로 부를 수 없기 때문이다. 그래서 패키지는 `require` 조건을 따로 내보내지 않는다. 기본값 위에 얹어 `{ root, out, match(file), enabled(target) }` 를
  돌려준다. `match` 는 `*`·`**` 만 지원하는 작은 glob 변환기로 짓는다(`path.matchesGlob` 는 편집기 Node 판본에 따라
  없을 수 있다).
- **`collect(ts, program, config)`**: 프로그램의 소스 파일 중 `config.match` 에 맞는 것을 훑는다. 그 안에서
  `createStore` 호출 중 첫 인자가 문자열 리터럴이고 둘째 인자가 함수인 것을 찾는다. 그 함수의 반환 타입을
  `checker.typeToTypeNode(type, undefined, NoTruncation | UseFullyQualifiedType)` 로 노드로 바꾸고 프린터로 글자로
  뽑는다. key 순으로 정렬한 `{ file, key, text }` 목록을 돌려준다.
- **`render(entries, config)`**: 생성 파일 내용을 짓는다. 타입 글자 안의 `import("절대 경로")` 는 생성 파일 기준
  상대 경로로 바꾼다.

생성 파일의 모양:

```ts
// 자동 생성 — @fortuna-lottery/store 가 쓴다. 고치지 않는다
export {};
import "./app/(home)/_state/combination.state";
import "./app/(home)/_state/generatorOpen.state";

declare module "@fortuna-lottery/store" {
  interface StateTypes {
    "state.home.combination": { numbers: number[] | null; choose: (numbers: number[]) => void };
    "state.home.generatorOpen": { open: boolean; toggle: () => void };
  }
}
```

부수효과 import 가 런타임 등록을 일으키고, `StateTypes` 가 타입을 준다. 생성 파일은 항상 내용이 같으면 다시
쓰지 않는다(감시와 Fast Refresh 가 헛돌지 않게).

### 도구 셋

- **`tools/cli.mjs`(`store-gen`)**: 현재 폴더에서 config 를 읽는다. `cli` 가 꺼져 있으면
  `store-gen: targets 에 cli 가 없어 건너뛴다` 를 찍고 0 으로 끝난다. 켜져 있으면 프로젝트의 `tsconfig.json` 으로
  프로그램을 지어 생성 파일을 쓴다.
- **`tools/next.mjs`(`withStore`)**: `(phase) => config` 꼴의 Next 설정 함수를 돌려준다. `next` 가 켜져 있으면 한 번
  생성하고, `phase === "phase-development-server"` 면 `fs.watch(root/src, { recursive: true })` 로 `config.match` 에
  맞는 파일의 변경(생성·삭제·내용 변경)마다 200 ms 묶어 다시 생성한다. Next 는 설정을 여러 번 읽으므로 감시는
  `globalThis` 표식으로 한 번만 건다.
- **`tools/plugin.cjs`**: tsserver 플러그인. `tsserver` 가 꺼져 있으면 언어 서비스를 그대로 돌려준다. 켜져 있으면
  언어 서비스 호스트의 `getScriptVersion`·`getScriptSnapshot` 을 감싼다. `config.out` 파일을 물으면 tsserver 가
  지어 둔 프로그램으로 `collect`·`render` 해 그 내용을 돌려주고, 내용이 바뀌면 판본을 올리고 디스크에도 쓴다.
  짓는 동안 다시 들어오면 앞의 내용을 준다(재진입 방지). 그래서 타건 한 번만큼 늦을 수 있다.

### 개발 사이클

1. `*.state.ts` 를 쓰거나 고친다.
2. 편집기의 tsserver 플러그인이 가상 선언을 채운다. 타건마다 key 와 상태 타입이 따라온다. 내용이 바뀌면 생성 파일을
   디스크에도 쓴다.
3. presenter 에서 `useSharedState` 를 쓴다. key 가 자동완성되고, 없는 key·없는 필드·`set` 의 없는 필드를 검사가 잡는다.
4. `next dev` 가 바뀐 생성 파일을 다시 싣는다. 생성 파일의 부수효과 import 가 런타임 등록을 일으킨다. 편집기 없이
   정의 파일이 바뀌면 `withStore` 의 감시가 생성 파일을 다시 쓴다.
5. vitest 와 `pnpm check` 는 `store-gen` 을 먼저 돌린다. 시험마다 `resetStores()` 로 상태를 되돌린다.
6. `next build` 는 `withStore` 가 한 번 생성한 파일로 빌드한다.

1~3 은 편집기 안에서, 4~6 은 디스크의 생성 파일로 돈다. 정의를 고치면 1 로 돌아간다.

### 정의 파일을 쓰는 규칙

- **`createStore("<key>", (set, get) => ({ … }))` 를 파일 최상단에서 한 번 부른다.** key 는 문자열 리터럴이다.
- **처음 값은 `get()` 에 기대지 않는다.** 생성기가 반환 타입을 뽑을 때의 `StateTypes` 는 직전 생성본이다.
  `get()` 은 바꾸는 함수 안에서만 쓴다.
- **바꾸는 함수의 인자는 타입을 적는다.** 상태 타입이 반환에서 추론되므로 인자 타입이 들어올 곳이 없다.
- **넓혀야 하는 처음 값은 `as` 로 적는다.** 예: `numbers: null as number[] | null`.
- **값에 쓰는 이름 붙은 타입은 export 한다.** 생성기는 그것을 `import("…").이름` 으로 쓴다.
- **서버 렌더 중에 `set` 을 부르지 않는다.** 전역 상태이므로 요청끼리 샌다.

### apps/web 이 바뀌는 것

정의 파일:

```ts
// app/(home)/_state/combination.state.ts
import { createStore } from "@fortuna-lottery/store";

/** 지금 고른 조합 — 생성기와 가정 실험실이 바꾸고, 통계·시뮬레이션·내 번호·가정 실험실이 읽는다 */
createStore("state.home.combination", (set) => ({
  numbers: null as number[] | null,
  choose: (numbers: number[]) => set({ numbers }),
}));

// app/(home)/_state/generatorOpen.state.ts
/** 생성기가 열렸는가 — 회차 카드가 바꾸고, 페이지와 회차 카드가 읽는다 */
createStore("state.home.generatorOpen", (set, get) => ({
  open: false,
  toggle: () => set({ open: !get().open }),
}));
```

key 는 바꾸지 않는다. `framework/paths.mjs` 와 key 꼴 규칙은 그대로다.

presenter 일곱(GeneratorCard·Home·HypothesisLab·LotterietusCard·PicksCard·SimulationCard·StatisticsPanel)은
`useStoreState(key)` 의 `[값, 바꾸는 함수들]` 을 `useSharedState(key, select)` 로 바꾼다. 값마다, 바꾸는 함수마다
한 번씩 부른다.

```ts
import { useSharedState } from "@fortuna-lottery/store/react";
const numbers = useSharedState("state.home.combination", (s) => s.numbers);
const choose = useSharedState("state.home.combination", (s) => s.choose);
```

배선:

- `apps/web/store.config.ts`: `defineConfig({ out: "src/composition/store.gen.ts", targets: ["tsserver", "next", "cli"] })`.
  `include` 는 기본값을 쓴다. 정의 파일은 모두 `src` 아래 `*.state.ts` 이고, 폴더 자리는 ESLint 가 지킨다. `out` 을
  `composition/` 으로 옮기는 것은 화면 모듈 안을 import 하는 파일이 조립 루트 밖에 생기지 않게 하려는 것이다(내 판단).
- `apps/web/package.json`: 의존성 `"@fortuna-lottery/store": "workspace:*"`. `"typecheck": "store-gen && tsc --noEmit"`.
- `apps/web/next.config.ts`: `export default withStore(nextConfig)`.
- `apps/web/tsconfig.json`: `plugins` 에 `{ "name": "@fortuna-lottery/store/plugin" }` 를 더한다.
- `.vscode/settings.json`: `"typescript.tsdk": "apps/web/node_modules/typescript/lib"` 와
  `"typescript.enablePromptUseWorkspaceTsdk": true`. 뿌리 `package.json` 에는 TypeScript 가 없으므로 `apps/web` 의 것을
  가리킨다. 루트 `.gitignore` 가 `.vscode/*` 를 무시하므로 `!.vscode/settings.json` 예외를 더해 커밋한다. tsserver 는
  플러그인을 tsconfig 가 있는 `apps/web` 의 `node_modules` 에서 찾고, 거기에는 pnpm 이 이 패키지를 심링크로 둔다.
- `apps/web/.gitignore`: `src/composition/store.gen.ts`.
- `composition/screens.ts`: 맨 위에 `import "./store.gen";`. `app/(home)/index.ts` 에서 `_state` import 두 줄을 지운다.
- `apps/web/package.json` 의 `lint:deps` 도 `store-gen` 을 먼저 부른다. 생성 파일이 없으면 dependency-cruiser 가
  `screens.ts → ./store.gen` 을 풀지 못하고 그 간선을 조용히 놓치기 때문이다.
- `turbo.json`: `apps/web` 의 `typecheck` 에 `outputs: ["src/composition/store.gen.ts"]` 를 단다. 캐시 적중으로
  `store-gen` 을 건너뛰어도 생성 파일이 되살아난다. 정의 파일은 git 이 추적하므로 turbo 의 입력 해시에 든다.
- `AppContainer.tsx` 는 바꾸지 않는다. `StoreProvider` 는 cache·http 용으로 남는다.

### 시험

- `vitest.config.ts`: `globalSetup` 이 `store-gen` 을 한 번 돌린다. `setupFiles: ["./src/test.setup.ts"]`.
- `src/test.setup.ts`: `import "@composition/screens"` 로 등록을 일으키고 `afterEach(() => resetStores())`.
- presenter 시험 여섯은 `container.resolve("state.…").actions.x()` 를 `getStore("state.…").getState().x()` 로 바꾼다.
  wrapper 는 cache·http 용 `StoreProvider` 만 남는다.
- `Home.presenter.test.ts` 의 「컨테이너마다 공통 상태가 따로다」는 「`resetStores()` 뒤에는 처음 값이다」로 바꾼다.
- 패키지 시험은 TDD 로 먼저 쓴다.
  - `src/index.test.ts`: 등록 즉시 읽힘, `setState` 의 병합과 `Object.is` 생략, 구독과 해제, `resetStores` 뒤 처음 값과
    구독자 유지, 등록되지 않은 key 의 실패 문구, 개발 모드의 재등록이 새 정의로 바뀜.
  - `src/react.test.tsx`: 고른 값이 바뀔 때만 다시 그림, 서버 스냅숏이 처음 값.
  - `tools/codegen.test.mjs`(`node --test`): 임시 폴더에 config 와 정의 파일을 두고 생성 내용을 대조한다. config 가
    없을 때 기본값, `include` glob, 꺼진 target, `import("…")` 상대 경로 변환, 내용이 같으면 쓰지 않음.
  - `tools/plugin.test.mjs`(`node --test`): tsserver 를 띄우지 않고, 임시 프로젝트에 실제 `ts.createLanguageService` 를
    짓고 플러그인의 `create(info)` 를 걸어 확인한다. 정의 파일을 고친 뒤 `getSemanticDiagnostics` 가 새 필드를 아는지,
    `config.out` 이 디스크에 쓰였는지, `tsserver` 가 꺼졌을 때 손대지 않는지를 본다. VS Code 에서 실제로 실리는지는
    구현 끝에 한 번 손으로 확인한다.
  - 타입 시험: 생성 파일이 있을 때 없는 key·없는 필드·`set` 의 없는 필드가 오류이고, 없을 때 key 가 `never` 인지를
    `@ts-expect-error` 로 고정한다.

### 걷어내는 것

- `apps/web/src/framework/areas/state.area.ts`.
- `framework/index.ts` 의 state 갈래(`AppStore.state`, `KeyOf<"state">` 쓰임, `InstanceOf` 의 state 갈래,
  `Built.resolve` 의 state key, `StateDef` 재수출).
- `framework/react.tsx` 의 `useStoreState`.
- `shared/lib/store/state.ts` 와 `shared/lib/store/index.ts` 의 그 재수출, `shared/lib/store-react` 의 `useStoreState`.
  다른 영역이 쓰지 않으면 지운다.

### 검사기

ESLint 의 state 규칙 다섯은 알아보는 호출만 바꾼다. 아래 표의 한 행은 「이 규칙은 지금 *이 호출*을 알아보고,
바뀐 뒤에는 *이 호출*을 알아본다」로 읽는다.

| 규칙 | 지금 알아보는 호출 | 바뀐 뒤 알아보는 호출 |
|---|---|---|
| `state-key-literal` | `useStoreState(…)`, `store.state(…)` | `useSharedState(…)`, `createStore(…)` |
| `state-key-matches-folder` | `store.state(…)` | `createStore(…)` |
| `state-key-within-scope` | `useStoreState(…)` | `useSharedState(…)` |
| `state-only-in-presenter` | `useStoreState(…)` | `useSharedState(…)` |
| `state-registers-in-state-folder` | `store.state(…)` | `createStore(…)` |

- **`createStore` 는 이름만으로 가리지 않는다.** 옛 엔진도 `createStore(areas)` 를 내보내고 `framework/index.ts` 가
  그것을 부른다. 그래서 위 규칙은 그 파일 안에서 `@fortuna-lottery/store` 로부터 가져온 `createStore` 만 알아본다.
- `no-renamed-store-import` 가 지키는 출처에 `@fortuna-lottery/store`·`@fortuna-lottery/store/react` 를 더한다.
- `hook-resolves-own-key-only` 의 「공통 상태는 `useStoreState` 로 꺼낸다」 문구를 `useSharedState` 로 고친다.
- `tools/checks/` 의 state 위반 표본과 허용 표본을 새 호출로 고친다.
- dependency-cruiser: `apps/api` 가 `@fortuna-lottery/store` 를 보지 않게 규칙 하나를 더한다(`web-must-not-reach-kernel`
  과 같은 꼴). `packages/store` 는 다른 작업 공간 패키지와 앱을 보지 않는다. 화면 모듈이 이 패키지를 바로 import
  하는 것은 허용한다(`screen-reaches-store-through-framework` 는 `@lib/store(-react)`·`di`·`events` 만 막는다).
- dependency-cruiser: 생성 파일 `composition/store.gen.ts` 는 화면 모듈의 `_state/*.state.ts`(위젯은 `state/*.state.ts`)
  만 깊게 import 할 수 있다. `no-deep-screen-or-widget-import` 에 이 파일 하나의 예외를 두고, 이 파일이 그 밖을
  import 하면 실패하는 규칙(`store-gen-imports-state-only`)을 더한다. `src/test.setup.ts` 는 시험 기반이므로
  `nothing-reaches-composition` 의 예외에 더한다. 두 규칙 모두 `tools/checks/` 에 위반 표본을 둔다.
- `turbo`: `apps/web` 의 `typecheck`·`build`·`test` 가 이 패키지의 `build` 에 기대는지 확인한다(`^build`).

### 출력 스냅숏

`store.describe()` 에서 `[state]` 절이 사라진다. `framework/describe.ts` 의 `describeWithUsage()` 가 `[state]` 절을
따로 지어 출력 맨 앞에 둔다.

- key 목록은 `registeredKeys()` 에서, 값은 `getStore(key).getInitialState()` 에서 읽는다. 함수가 아닌 필드는 값으로,
  함수인 필드는 이름으로 찍는다.
- key 마다 찍는 줄: `state.home.combination = {"numbers":null}`, `  바꾸는 함수: choose`, `  정의: <파일>`,
  `  쓰는 곳: <presenter 목록>`.
- 정의 자리는 `createStore("…"` 를, 쓰는 곳은 presenter 의 `useSharedState("…"` 를 정규식으로 찾는다.
- **읽는 곳과 바꾸는 곳은 가르지 않고 「쓰는 곳」 하나로 찍는다.** 선택자 꼴에서는 값을 고르는지 함수를 고르는지를
  정규식으로 가를 수 없다.

스냅숏이 바뀌는 것은 의도한 변화다.

### 문서

- `CLAUDE.md`: 「자식 뷰가 함께 쓰는 상태 둘」·「state 의 등록부 값은 정의 자체다」·「store 엔진은 …」 절과 뼈대
  트리, 명령어 절(`store-gen`)을 새 모양에 맞춰 고친다. 이것이 1단계라는 것과 cache·http·event·route 는 아직 옛
  store 에 있다는 것을 적는다.
- [보고 문서](../reports/2026-10-13-vault-feedback.md): state 가 규약 층의 store 를 떠나 독립 패키지가 되었다는
  어긋남을 한 줄 올린다.

## 설계자가 정한 것 (검토에서 나온 빈자리)

- 생성 파일 자리를 `composition/` 으로 옮기고, 의존 규칙에 그 파일 하나의 예외와 그 파일 전용 규칙을 둔다.
- `src/test.setup.ts` 는 `nothing-reaches-composition` 의 예외다.
- `lint:deps` 도 `store-gen` 을 먼저 부르고, turbo 의 `typecheck` 는 생성 파일을 `outputs` 로 낸다.
- `.vscode/settings.json` 을 커밋하고 `tsdk` 는 `apps/web` 의 TypeScript 를 가리킨다.
- 플러그인은 실제 언어 서비스로 자동 시험하고, VS Code 에서 한 번 손으로 확인한다.
- config 를 실을 때 `@fortuna-lottery/store/config` 를 가로채 CJS 빌드를 두지 않는다.

## 빌더에게 맡기는 것

- 패키지 안의 파일 나눔과 내부 이름.
- `globalSetup` 파일의 이름과 자리.
- 플러그인이 「config.out 파일인가」를 가리는 방식(경로 정규화).
- presenter 마다 선택자를 몇 번 부를지(값마다 한 번이 기본).
