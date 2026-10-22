# 공통 상태 라이브러리 2단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@fortuna-lottery/store` 에 `ctx`·처음 꺼낼 때 짓기·`overrideStore`·`useStore`(표식 맡기기·pick/omit)·`createResource`·`createEvent` 를 더하고, `apps/web` 의 cache·http·event 를 그 위로 옮긴 뒤 옛 store(framework·di·container·StoreProvider)를 걷어낸다.

**Architecture:** 라이브러리를 먼저 넓히되 1단계 API(`useSharedState`)는 옮기기가 끝날 때까지 남긴다(Task 1~4). 앱은 등록을 싣는 자리와 검사기를 먼저 새 key 체계(`state.`·`api.`·`event.`·`infra.`)에 맞춘 뒤(Task 5), 화면을 둘로 나눠 옮기고(Task 6·7), 마지막에 옛 store 와 `useSharedState` 를 걷어낸다(Task 8). 매 Task 끝에 `pnpm check` 가 통과한다.

**Tech Stack:** TypeScript 5.9 · React 19 · Next.js 15 · Vitest(jsdom) · `node --test` · dependency-cruiser · ESLint(typescript-eslint)

**Spec:** [2026-10-22-store-stage2-design.md](../specs/2026-10-22-store-stage2-design.md). 앞선 설계 [1단계](../specs/2026-10-21-state-library-design.md) 의 결정은 그대로 유효하다.

## Global Constraints

- 작업 자리는 워크트리 `C:/Users/hnpark/orca/workspaces/fortuna-lottery/store-resource`(브랜치 `store-resource+`)다. 경로는 모두 이 워크트리 기준이다.
- 매 Task 끝에 `pnpm check` 가 통과한다(typecheck → lint → lint:deps → lint:side-effects → test → test:tools). 라이브러리 시험은 `pnpm --filter @fortuna-lottery/store test`.
- 새 의존 패키지를 들이지 않는다. zustand·TanStack Query 를 들이지 않는다.
- 라이브러리(`packages/store`)는 쓰는 프로젝트의 규약을 모른다. `state.`·`api.`·`event.`·`infra.` 같은 key 접두, `_action`·`_state` 같은 폴더 이름을 라이브러리 코드에 적지 않는다.
- key 는 `<접두>.<소유 폴더 경로>.<이름>` 이다. 소유 폴더 경로는 `app/` 아래 폴더를 점으로 잇되 라우트 그룹 괄호를 빼고, `_state`·`_action` 폴더는 마디에 넣지 않는다(`app/(home)/PicksCard/_action/picks.state.ts` → `home.PicksCard`). `infra.<이름>` 은 `infrastructure/<이름>/` 에서 정의한다.
- 이 계획이 쓰는 key 는 이것으로 고정한다.
  - `infra.http`
  - `event.home.PicksCard.changed`(값 `{ kind: "saved" | "removed" }`)
  - `api.home.PicksCard.picks`(조회 + `save`·`remove`)
  - `api.home.ResultsCard.check`(조회, `auto: false`, `event.home.PicksCard.changed` 에서 `exempt`)
  - `api.home.LotterietusCard.status`(조회)
  - `api.home.StatisticsPanel.statistics`(조회)
  - `api.home.HypothesisLab.popularity`(조합을 인자로 받는 조회)
  - `api.home.HypothesisLab.assumption`(바꾸기 `evaluate`·`generate`)
  - `api.home.GeneratorCard.generator`(바꾸기 `generate`)
  - `api.home.SimulationCard.backtest`(바꾸기 `backtest`)
  - `state.home.combination`·`state.home.generatorOpen`(1단계 그대로)
- 정의 파일은 모두 `*.state.ts` 다. 자원은 `_action/<자원>.state.ts`, event 는 `_action/<도메인>.event.state.ts`, 바깥 도구는 `infrastructure/<이름>/<이름>.state.ts`.
- `exempt` 의 까닭 문구: `결과는 사람이 「당첨 대조」를 눌러 받는다 — 누르기 전까지 앞선 결과를 그대로 보인다`.
- 화면에 보이는 문구와 오류 문구 기본값은 지금 action 파일의 것을 그대로 쓴다. `FetchHttpClient` 가 서버 본문의 `{ error }` 문구를 꺼내는 동작은 그대로다.
- 커밋 메시지는 `feat(store):`·`refactor(web):`·`chore(checks):`·`docs:` 접두에 한국어 본문, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 코드 주석은 한국어, 이 저장소의 말투(-다)를 따른다.

## Review Focus

1. **늦게 온 응답이 지금 값을 덮는다.** 조합을 A→B→A 로 빠르게 바꾸거나 바꾸기를 연달아 누를 때, 앞선 요청의 응답이 나중 요청의 칸을 덮으면 안 된다. Task 3 의 자원 시험과 Task 7 의 인기 패턴 시험이 잡는다.
2. **시험이 꽂은 가짜가 다음 시험으로 샌다.** `overrideStore("infra.http", …)` 뒤 `resetStores()` 가 처음 정의로 되돌리지 않으면 다음 시험이 가짜를 본다. Task 1 시험이 잡는다.
3. **다시 지어진 event store 에서 듣기가 끊긴다.** event store 를 덮어쓰거나 다시 지으면, 그것을 듣던 자원도 다시 지어 `on` 을 다시 걸어야 한다. Task 1·3 시험이 잡는다.
4. **바꾸기만 고른 화면이 조회를 시작한다.** `useStore(key, { pick: ["save"] })` 가 목록을 받으면 안 된다. Task 3 시험이 잡는다.
5. **생성 결과에 `any` 가 남아 타입 검사가 조용히 꺼진다.** 새 key 의 첫 생성에서 `get()`·`cache` 에 기대는 함수가 `any` 로 찍히면 안 된다. Task 4 시험이 잡는다.

---

### Task 0: 계획 문서 선 커밋

- [ ] **Step 1:** `docs/superpowers/plans/2026-10-22-store-stage2.md` 를 커밋하고 push 한다(메시지 `docs: 공통 상태 라이브러리 2단계 실행 계획`).

---

### Task 1: 라이브러리 핵심 — ctx · 처음 꺼낼 때 짓기 · overrideStore · pick/omit

**Files:**
- Modify: `packages/store/src/index.ts`
- Test: `packages/store/src/index.test.ts`

**Interfaces:**
- Produces (`@fortuna-lottery/store`):
  - `createStore<K extends string>(key: K, creator: (set: SetState<StateOf<K>>, get: GetState<StateOf<K>>, ctx: Ctx) => object): void`
  - `interface Ctx { <K extends StateKey>(key: K): StateOf<K>; <K extends StateKey, N extends Names<K>, O extends PickOptions<K, N>>(key: K, options: O): Picked<K, O>; readonly key: string }`
  - `type Names<K> = keyof StateOf<K> & string`
  - `type PickOptions<K, N> = { pick: readonly N[]; omit?: never } | { omit: readonly N[]; pick?: never }`
  - `type Picked<K, O>` — `pick` 이면 `Pick<StateOf<K>, N>`, `omit` 이면 `Omit<StateOf<K>, N>`
  - `pickFrom(state: object, options?: { pick?: readonly string[]; omit?: readonly string[] }): object` — 고른 함수 칸은 원래 상태 객체를 `this` 로 묶어 준다
  - `overrideStore<K extends StateKey>(key: K, creator: (set, get, ctx) => object): void`
  - `getStore`·`resetStores`·`registeredKeys` 는 이름·서명 그대로. `StoreApi` 는 key 마다 같은 객체.

- [ ] **Step 1: 실패하는 시험을 쓴다** (`index.test.ts` 에 더한다)
  - 「등록만 하면 짓지 않는다」: creator 안의 `vi.fn()` 이 `createStore` 직후 0 번, `getStore(key).getState()` 뒤 1 번 불린다.
  - 「`ctx(key)` 는 부르는 순간의 값을 준다」: A 의 동작이 `ctx("b").n` 을 돌려주고, B 를 `setState({ n: 2 })` 한 뒤 그 동작이 `2` 를 돌려준다.
  - 「`ctx(key, { pick: ["n"] })` 는 고른 칸만 준다」: `Object.keys(결과)` 가 `["n"]`.
  - 「`ctx.key` 는 짓고 있는 store 의 key 다」: creator 가 `ctx.key` 를 상태에 담고 그 값이 등록한 key 와 같다.
  - 「짓는 사슬이 돌면 순환으로 실패한다」: A 의 creator 가 `ctx("b")`, B 의 creator 가 `ctx("a")` 를 부르면 `getStore("a").getState()` 가 `/순환한다: a → b → a/` 로 던진다.
  - 「등록 순서와 상관없이 짓는 순간 다른 store 를 꺼낸다」: A(creator 가 `ctx("b")` 를 부름)를 B 보다 먼저 등록해도 `getStore("a").getState()` 가 던지지 않는다.
  - 「`overrideStore` 는 처음 정의 대신 짓고, `resetStores` 가 되돌린다」: `infra` 를 `{ v: "real" }` 로 등록, `overrideStore("infra", () => ({ v: "fake" }))` 뒤 `ctx` 로 읽으면 `"fake"`, `resetStores()` 뒤 `"real"`.
  - 「덮어쓰면 그 key 를 짓는 동안 꺼낸 store 도 다시 짓는다」: A 의 creator 가 짓는 순간 `ctx("ev")` 에 듣기를 건다. `overrideStore("ev", …)` 뒤 새 ev 의 `emit` 이 A 의 반응을 부른다.
  - 「`getStore(key)` 는 다시 지어도 같은 객체다」: `overrideStore` 앞뒤의 `getStore("a")` 가 `toBe` 로 같다.
  - 「`pickFrom` 이 고른 메서드는 원래 객체를 this 로 쓴다」: 상태 `{ n: 1, read() { return this.n } }` 에서 `pickFrom(s, { pick: ["read"] }).read()` 가 `1`.
  - 「`resetStores` 는 전부 무른 뒤 다시 짓는다」: 듣기를 거는 A 와 event store E 가 있을 때 `resetStores()` 뒤 E 의 `emit` 이 A 의 반응을 한 번 부른다.
  - 지금 있는 1단계 시험(재등록 덮어쓰기, 운영 모드 이중 등록 실패, 처음 값 되돌리기)은 그대로 통과해야 한다.

- [ ] **Step 2: 시험이 실패하는지 돌린다**
  Run: `pnpm --filter @fortuna-lottery/store exec vitest run src/index.test.ts`
  Expected: 새 시험이 FAIL(`ctx` 가 undefined, 처음 꺼낼 때 짓지 않음 등)

- [ ] **Step 3: 구현한다** (`src/index.ts`)
  - 항목마다 `original`(처음 등록한 정의)·`current`(개발 모드 재등록이 바꾼 정의)·`override` 를 들고, 짓기는 `override ?? current` 를 쓴다.
  - 짓는 동안 `ctx` 로 꺼낸 key 를 그 항목의 `deps` 에 모은다. 어떤 key 를 무르면 `deps` 에 그 key 를 가진 항목도 무른다(재귀).
  - 무르기 뒤 「보는 화면이 있는(구독자가 있는) 항목」은 바로 다시 짓고 알린다. `resetStores` 는 모든 override 를 지우고, 전부 무른 다음에 다시 짓는다.
  - 운영 모드에서 같은 key 를 두 번 `createStore` 하면 지금처럼 던진다. 개발 모드 재등록은 `current` 를 바꾸고 그 항목을 무른다.

- [ ] **Step 4: 시험이 통과하는지 돌린다**
  Run: `pnpm --filter @fortuna-lottery/store test` → PASS. 이어서 `pnpm check` → 통과(앱의 1단계 정의는 `(set) => …` 그대로라 깨지지 않는다)

- [ ] **Step 5: 커밋한다** — `feat(store): creator 에 ctx 를 넘기고 처음 꺼낼 때 짓는다 — overrideStore·pick/omit`

---

### Task 2: `useStore` — 표식 맡기기와 pick/omit

**Files:**
- Modify: `packages/store/src/index.ts`(`USE` 표식), `packages/store/src/react.ts`
- Test: `packages/store/src/react.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `getStore`·`pickFrom`·`Names`·`PickOptions`·`Picked`
- Produces:
  - `export const USE: unique symbol` (`@fortuna-lottery/store`)
  - `useStore` (`@fortuna-lottery/store/react`):
    - 상태에 `[USE]` 가 없으면 `useStore(key)`·`useStore(key, { pick })`·`useStore(key, { omit })` → `StateOf<K>`·`Pick`·`Omit`
    - 상태에 `[USE]` 가 있으면 `useStore(key, ...args)` → `state[USE](...args)` 의 반환. 타입은 `[USE]` 의 인자·반환에서 나온다.
  - `useSharedState` 는 이 Task 에서 그대로 둔다(Task 8 에서 지운다).

- [ ] **Step 1: 실패하는 시험을 쓴다**
  - 「인자 없이 꺼내면 상태 전부」: `useStore("a")` 의 `n` 이 `setState` 뒤 바뀐다.
  - 「`pick` 은 고른 칸이 바뀔 때만 다시 그린다」: `{ pick: ["n"] }` 로 꺼낸 컴포넌트의 그리기 횟수가 `m` 만 바꾼 `setState` 뒤 늘지 않는다.
  - 「`omit` 은 뺀 칸이 바뀌어도 다시 그리지 않는다」.
  - 「`pick` 으로 꺼낸 객체는 칸이 같으면 같은 참조다」: 두 번 그린 사이 `toBe`.
  - 「표식이 있으면 꺼내기를 맡긴다」: 상태 `{ [USE]: (x: number) => x * 2 }` 에서 `useStore("q", 3)` 가 `6`.
  - 「서버 렌더는 처음 값을 준다」: `renderToString` 으로 그린 결과가 처음 값.

- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/store exec vitest run src/react.test.tsx`

- [ ] **Step 3: 구현한다.** `useSyncExternalStore` 의 스냅숏 함수가 `pickFrom` 결과를 칸 단위 `Object.is` 로 앞 결과와 견주어 같으면 앞 객체를 돌려준다(서버 스냅숏도 같은 비교). `[USE]` 갈래와 pick 갈래는 key 마다 늘 같은 쪽으로 가므로 훅 순서가 바뀌지 않는다.

- [ ] **Step 4: 통과를 확인한다** — 라이브러리 시험 PASS, `pnpm check` 통과

- [ ] **Step 5: 커밋한다** — `feat(store): useStore 하나로 꺼낸다 — 표식에 맡기기와 pick·omit`

---

### Task 3: 정의 도우미 — `createResource`·`createEvent` (`@fortuna-lottery/store/query`)

**Files:**
- Create: `packages/store/src/query.ts`, `packages/store/src/query.test.tsx`
- Modify: `packages/store/package.json`(`exports` 에 `"./query": { "types": "./dist/query.d.ts", "import": "./dist/query.js" }`)

**Interfaces:**
- Consumes: Task 1·2 의 `USE`·`useStore`
- Produces (`@fortuna-lottery/store/query`, 파일 머리에 `"use client"` 를 두지 않는다):
  - `createEvent<P>(): { emit(payload: P): void; on(who: string, fn: (payload: P) => void): () => void; exempt(who: string, why: string): void; record(): { on: string[]; exempt: Array<{ who: string; why: string }> } }`
  - `createResource<R>(define: (cache: Cache<A, D>) => R, options?: { auto?: boolean }): Resource<R>`
    - `R` 의 `query?: (args: A) => Promise<D>` 가 조회, 나머지 함수 칸이 바꾸기. `A`·`D` 는 `query` 서명에서 추론.
    - `interface Cache<A, D> { getData(args?: A): D | undefined; setData(updater: D | ((prev: D | undefined) => D | undefined), args?: A): void; invalidate(args?: A): Promise<void>; fetch(args?: A): Promise<D> }`
    - 상태(store 끼리·시험이 보는 것): `{ fetch, getData, setData, invalidate, ...바꾸기 함수(원래 객체를 this 로 묶은 것), [USE] }`
    - `useStore(key, options?: { args?: A; pick?: …; omit?: … })` 의 반환: `{ data: D | undefined; status: "idle" | "loading" | "ready" | "error"; error: string | null; refetch(): Promise<void> }` 와 바꾸기마다 `{ mutate(...args): Promise<결과 | undefined>; pending: boolean; error: string | null; data: 결과 | undefined; reset(): void }`

- [ ] **Step 1: 타입 추론부터 확인하는 시험을 쓴다** (스펙 「Claude 가 정한 것」 10)
  - 「`cache` 의 타입이 `query` 에서 추론된다」: `createResource((cache) => ({ query: async () => [1, 2], async add(n: number) { cache.setData((prev) => [...(prev ?? []), n]) } }))` 가 컴파일되고, `expectTypeOf` 로 `getData()` 가 `number[] | undefined`.
  - 추론이 막히면 `query` 에 반환 타입을 적는 꼴(`query: async (): Promise<number[]> => …`)로 같은 단언이 통과하는지 확인하고, 그 꼴을 이 Task 의 문서 주석과 이후 Task 의 정의 꼴로 쓴다. 어느 쪽인지 Task 보고에 적는다.

- [ ] **Step 2: 동작 시험을 쓴다**
  - event: 「`emit` 은 `on` 한 반응을 부른다」, 「같은 who 가 다시 `on` 하면 갈아 끼운다(한 번만 불린다)」, 「같은 who 가 `on` 과 `exempt` 를 함께 적으면 던진다」(두 순서 모두), 「`record()` 가 on·exempt 를 정렬해 준다」.
  - 조회: 「같은 칸을 보는 두 화면이 요청 하나를 나눠 쓴다」(fetch 호출 1 번), 「다시 받는 동안 앞선 data 를 남긴다」, 「실패해도 앞선 data 를 남기고 error 를 둔다」, 「A→B→A 에서 늦게 온 A 의 첫 응답은 버린다」, 「`auto: false` 면 화면이 떠도 받지 않고 `refetch` 로 받는다」, 「`query` 가 인자를 받는데 `args` 가 undefined 면 받지 않는다」, 「`invalidate()` 는 받아 둔 칸을 모두 다시 받는다」, 「`fetch(args)` 는 이미 받은 칸이면 다시 받지 않고 값을 준다」.
  - 바꾸기: 「진행·오류·결과는 부른 화면의 것이다」(두 컴포넌트 중 하나만 `mutate` 해도 다른 쪽 `pending` 은 false), 「`mutate` 는 실패해도 던지지 않고 error 를 둔다」, 「화면 안에서 늦게 온 응답은 버린다」, 「store 끼리 부르는 바꾸기는 실패하면 던진다」.
  - 고르기: 「`pick: ["save"]` 로 꺼내면 조회를 시작하지 않는다」(fetch 0 번).
  - this: 「메서드 꼴은 `this.다른함수()` 를 부를 수 있고, 화살표 꼴과 섞어도 된다」.
  - 이름: 「바꾸기 이름이 `data`·`status`·`error`·`refetch` 면 지을 때 던진다」.

- [ ] **Step 3: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/store exec vitest run src/query.test.tsx`

- [ ] **Step 4: 구현한다.** 조회 칸 이름은 `JSON.stringify(args ?? null)`. 칸마다 요청 차례를 세고, 진행 중인 약속을 들고 있다가 겹치면 그것을 돌려준다. `[USE]` 안의 훅은 `useSyncExternalStore`·`useEffect`·`useState`·`useRef` 만 쓴다(`react` 는 peer 의존). 바꾸기의 화면별 상태는 `[USE]` 안 `useState` 다.

- [ ] **Step 5: 통과를 확인한다** — 라이브러리 시험 PASS, `pnpm --filter @fortuna-lottery/store build` 로 `dist/query.js` 가 생긴다, `pnpm check` 통과

- [ ] **Step 6: 커밋한다** — `feat(store): 정의 도우미 createResource·createEvent 를 store/query 로 낸다`

---

### Task 4: 생성기 — 고정점까지 되풀이하고 `any` 를 거부한다

**Files:**
- Modify: `packages/store/tools/codegen.cjs`
- Test: `packages/store/tools/codegen.test.mjs`

**Interfaces:**
- Produces: `generate(ts, config)` 의 동작만 바뀐다. 생성 파일의 꼴(`interface StateTypes`)은 그대로다.

- [ ] **Step 1: 실패하는 시험을 쓴다**
  - 「새 key 의 첫 생성에서도 `get()` 에 기대는 함수의 반환 타입이 맞게 찍힌다」: 생성 파일이 없는 상태에서 `createStore("state.x.y", (set, get) => ({ n: 1, read: () => get().n }))` 를 생성하면 `read: () => number` 가 찍힌다.
  - 「결과에 `any` 가 남으면 실패한다」: 자기 자신을 되부르는 반환 타입 없는 메서드를 정의하면 `generate` 가 `/any/` 를 담은 오류로 던지고 생성 파일을 쓰지 않는다.
  - 「`createResource` 를 돌려주는 정의도 찍힌다」: `createStore("api.x.r", () => createResource(() => ({ query: async () => 1 })))` 의 타입 글자에 `any` 가 없다.

- [ ] **Step 2: 실패를 확인한다** — `node --test packages/store/tools/codegen.test.mjs`

- [ ] **Step 3: 구현한다.** 생성 내용을 가상 파일로 프로그램에 넣고 다시 뽑기를 되풀이해, 결과가 바뀌지 않으면 멈춘다(최대 5 번, 넘으면 던진다). 뽑은 타입 글자에 낱말 `any` 가 있으면 그 key 와 파일을 담아 던진다.

- [ ] **Step 4: 통과를 확인한다** — `pnpm --filter @fortuna-lottery/store test` PASS(플러그인·CLI·Next 시험 포함), `pnpm check` 통과

- [ ] **Step 5: 커밋한다** — `feat(store): 생성기가 고정점까지 되풀이하고 결과의 any 를 거부한다`

---

### Task 5: 앱 바탕 — 등록을 싣는 자리 · infra.http · key 규칙을 모든 접두로

**Files:**
- Create: `apps/web/src/infrastructure/http/http.state.ts`, `apps/web/src/app/StoreRegistry.tsx`
- Move: `apps/web/src/framework/paths.mjs`·`paths.test.ts` → `apps/web/eslint/paths.mjs`·`apps/web/eslint/paths.test.ts`(import 하는 자리를 함께 고친다)
- Modify: `apps/web/src/app/layout.tsx`, `apps/web/src/test.setup.ts`, `apps/web/eslint.config.mjs`, `.dependency-cruiser.cjs`, `apps/web/store.config.ts`(필요하면), `tools/checks/` 표본

**Interfaces:**
- Produces:
  - `infra.http` store: `{ client: HttpClient }` (`createStore("infra.http", () => ({ client: new FetchHttpClient() as HttpClient }))`)
  - `apps/web/eslint/paths.mjs`: `ownerPathOf(file)`(`_state`·`_action` 을 마디에서 뺀다), `keyPrefixOf(file, area: "state" | "api" | "event")` → `"<area>.<owner>."`, `canReach(key, file)` → `event.` 는 늘 true, `infra.` 는 늘 true, 나머지는 지금 규칙
  - `StoreRegistry`: `"use client"` 컴포넌트. 생성 파일(`@composition/store.gen`)을 부수효과로 import 하고 `children` 을 그대로 그린다.

- [ ] **Step 1: 실패하는 시험을 쓴다** (`eslint/paths.test.ts`)
  - `ownerPathOf(".../src/app/(home)/PicksCard/_action/picks.state.ts")` → `"home.PicksCard"`
  - `keyPrefixOf(".../src/app/(home)/PicksCard/_action/picks.state.ts", "api")` → `"api.home.PicksCard."`
  - `canReach("event.home.PicksCard.changed", ".../src/app/(home)/ResultsCard/_action/check.state.ts")` → `true`
  - `canReach("api.home.PicksCard.picks", ".../src/app/(home)/ResultsCard/ResultsCard.presenter.ts")` → `false`
  - `canReach("infra.http", ".../src/app/(home)/PicksCard/_action/picks.state.ts")` → `true`
  - 지금 `paths.test.ts` 의 state 시험은 그대로 통과한다.

- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/web exec vitest run eslint/paths.test.ts`

- [ ] **Step 3: 구현하고 잇는다.**
  - `paths.mjs` 를 옮기고 위 함수로 넓힌다. eslint 의 state 규칙(`state-key-literal`·`state-key-matches-folder`·`state-key-within-scope`·`state-registers-in-state-folder`·`state-only-in-presenter`)을 `state.`·`api.`·`event.` key 와 `useStore`·`ctx` 호출로 넓힌다. 이름은 그대로 두되 메시지의 「state」를 「store」로 고친다. `infra.` key 는 `infrastructure/**/*.state.ts` 에서만 등록하게 한다.
  - `state-registers-in-state-folder` 의 허용 자리에 `_action/*.state.ts`·`infrastructure/**/*.state.ts` 를 더한다. 시험 파일(`*.test.*`)은 `overrideStore` 를 쓰므로 이 규칙과 `store-registers-at-top-level` 에서 뺀다.
  - `.dependency-cruiser.cjs` 의 `store-gen-imports-state-only` 를 `_state|_action` 아래 `*.state.ts` 와 `infrastructure/**/*.state.ts` 로 넓힌다. `screen-sees-infrastructure-types-only` 에서 시험 파일이 `@infrastructure/http` 의 `TestHttpClient` 를 값으로 가져오는 것을 허용한다.
  - `layout.tsx` 는 `@composition/store.gen` 을 부수효과로 import 하고 `<StoreRegistry>` 로 `children` 을 감싼다(`AppContainer` 는 Task 8 까지 그 안쪽에 둔다). `test.setup.ts` 도 `@composition/store.gen` 을 import 한다(`@composition/screens` 는 Task 8 까지 함께 둔다).
  - 바뀐 규칙마다 `tools/checks/` 의 위반 표본·허용 표본을 맞춘다.

- [ ] **Step 4: 확인한다**
  - `pnpm check` 통과
  - `bash tools/checks/run-violations.sh` 모든 줄 OK(CRLF 로 깨지면 `tr -d '\r'` 사본을 Git bash 로 돌리고 사본은 커밋하지 않는다)
  - `pnpm --filter @fortuna-lottery/web build` 성공

- [ ] **Step 5: 커밋한다** — `chore(checks): store key 규칙을 api·event·infra 로 넓히고 등록을 싣는 자리를 세운다`

---

### Task 6: 내 픽과 당첨 대조를 자원으로 옮긴다

**Files:**
- Create: `apps/web/src/app/(home)/PicksCard/_action/picks.state.ts`, `apps/web/src/app/(home)/PicksCard/_action/picks.event.state.ts`, `apps/web/src/app/(home)/ResultsCard/_action/check.state.ts`
- Delete: `PicksCard/_action/{listPicks,savePick,deletePick}.action.ts`(+ 시험), `ResultsCard/_action/checkResults.action.ts`(+ 시험)
- Modify: `PicksCard.presenter.ts`(+ 시험), `ResultsCard.presenter.ts`(+ 시험)
- Create Test: `PicksCard/_action/picks.state.test.ts`, `ResultsCard/_action/check.state.test.ts`

**Interfaces:**
- Consumes: Task 3 의 `createResource`·`createEvent`, Task 5 의 `infra.http`
- Produces: `event.home.PicksCard.changed`, `api.home.PicksCard.picks`(`query`·`save(numbers)`·`remove(id)`), `api.home.ResultsCard.check`

- [ ] **Step 1: 실패하는 시험을 쓴다** (`overrideStore("infra.http", () => ({ client: http }))` 와 `TestHttpClient`)
  - `picks.state.test.ts`
    - 「저장하면 응답으로 목록 맨 앞에 더하고 다시 받지 않는다」: `/api/picks` GET 이 `sent` 에 1 번, `getData()` 의 첫 id 가 응답의 id.
    - 「저장하면 `event.home.PicksCard.changed` 가 `{ kind: "saved" }` 로 나간다」
    - 「저장이 실패하면 event 를 내지 않는다」
    - 「삭제는 먼저 목록에서 빼고, 실패하면 되돌린다」
    - 「삭제 경로는 `/api/picks/${encodeURIComponent(id)}` 의 DELETE 다」: id `"a b"` → `/api/picks/a%20b`
  - `check.state.test.ts`
    - 「픽이 바뀌어도 당첨 대조는 다시 받지 않는다」: `api.home.ResultsCard.check` 를 지은 뒤 `save` 해도 `/api/results` 가 `sent` 에 없다.
    - 「`event.home.PicksCard.changed` 의 `record().exempt` 에 `api.home.ResultsCard.check` 와 Global Constraints 의 까닭 문구가 있다」
    - 「화면이 떠도 받지 않고 `refetch` 로 받는다」
  - presenter 시험은 지금의 단언(라벨 문구, loading, empty 등)을 그대로 두고 `useStore` 를 쓰게 고친다.

- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/web exec vitest run "src/app/(home)/PicksCard" "src/app/(home)/ResultsCard"`

- [ ] **Step 3: 구현한다.** 스펙 §5·§7 의 예 그대로. presenter 는 `useStore("api.home.PicksCard.picks")`·`useStore("api.home.ResultsCard.check")`·`useStore("state.home.combination", { pick: ["numbers"] })` 로 꺼낸다. 옛 `store.invalidates`·`store.unaffected` 줄은 새 정의로 대신한다.

- [ ] **Step 4: 확인한다** — 위 시험 PASS, `pnpm check` 통과

- [ ] **Step 5: 커밋한다** — `refactor(web): 내 픽과 당첨 대조를 자원으로 옮긴다`

---

### Task 7: 나머지 화면을 자원으로 옮긴다

**Files:**
- Create: `LotterietusCard/_action/status.state.ts`, `StatisticsPanel/_action/statistics.state.ts`, `HypothesisLab/_action/{popularity,assumption}.state.ts`, `GeneratorCard/_action/generator.state.ts`, `SimulationCard/_action/backtest.state.ts`(모두 `apps/web/src/app/(home)/` 아래)
- Delete: 그 폴더들의 `*.action.ts`(+ 시험)
- Modify: 그 화면들의 presenter(+ 시험), `Home.presenter.ts`(+ 시험)
- Create Test: `HypothesisLab/_action/popularity.state.test.ts`

**Interfaces:**
- Consumes: Task 3·5
- Produces: Global Constraints 의 나머지 `api.*` key

- [ ] **Step 1: 실패하는 시험을 쓴다**
  - `popularity.state.test.ts`
    - 「조합이 없으면 받지 않는다」: `useStore("api.home.HypothesisLab.popularity", { args: undefined })` 뒤 `sent` 0.
    - 「조합이 A→B→A 로 바뀌면 늦게 온 A 의 첫 응답을 보이지 않는다」: A 의 첫 응답을 미뤄 두고 B, 다시 A 로 바꾼 뒤 A 의 둘째 응답 → 첫 응답 순으로 풀어도 `data` 는 둘째 응답이다.
  - presenter 시험(Generator·Hypothesis·Lotterietus·Statistics·Simulation·Home)은 지금 단언을 그대로 두고 `useStore` 로 고친다. HypothesisLab 의 「스위치를 바꾸면 평가 결과를 비운다」는 `evaluate.reset()` 으로 지킨다.

- [ ] **Step 2: 실패를 확인한다** — 해당 폴더 vitest

- [ ] **Step 3: 구현한다.**
  - 조회만: status·statistics(인자 없음), popularity(인자 `numbers: readonly number[]`).
  - 바꾸기만: `generator.generate(mode, selected)`, `assumption.evaluate(assumption)`·`assumption.generate(assumption)`, `backtest.backtest(numbers)`. 결과는 함수의 반환값이고 화면에서는 `mutate` 의 `data` 다.
  - 생성 결과를 공통 상태에 올리는 일(`choose`)은 지금처럼 presenter 가 한다(스펙의 체인 예는 예시이고 이 저장소는 지금 꼴을 지킨다).
  - `state.home.*` 를 꺼내는 곳은 모두 `useStore(key, { pick: [...] })` 로 바꾼다.

- [ ] **Step 4: 확인한다** — `pnpm check` 통과, `rg "useSharedState|use[A-Z]\w*Action" apps/web/src` → 0

- [ ] **Step 5: 커밋한다** — `refactor(web): 통계·회차·가정 실험실·생성기·시뮬레이션을 자원으로 옮긴다`

---

### Task 8: 옛 store 를 걷어내고 출력·문서를 맞춘다

**Files:**
- Delete: `apps/web/src/framework/`, `apps/web/src/shared/lib/{store,store-react,di,events,cache}/`, `apps/web/src/composition/{createContainer,createContainer.test,screens,routes}.ts`, `apps/web/src/app/AppContainer.tsx`, `apps/web/src/app/(home)/routes.ts`
- Modify: `apps/web/src/app/layout.tsx`, `apps/web/src/test.setup.ts`, `apps/web/src/composition/store.describe.test.ts`(+ 스냅숏), `packages/store/src/react.ts`(`useSharedState` 를 지운다)·`react.test.tsx`, `apps/web/eslint.config.mjs`, `.dependency-cruiser.cjs`, `apps/web/tsconfig.json`·`vitest.config.ts`(`@framework` 별칭), `tools/checks/` 표본, `CLAUDE.md`, `docs/superpowers/reports/2026-10-13-vault-feedback.md`

**Interfaces:**
- Consumes: Task 1~7 전부

- [ ] **Step 1: 출력 스냅숏 시험을 새로 쓴다** (`store.describe.test.ts`)
  - `registeredKeys()` 를 모두 지은 뒤 세 절을 낸다: state 절(지금의 꼴 — 무엇을 바꾸는가·정의·쓰는 곳), event 절(key 마다 `on`·`exempt` 와 까닭), 자원 목록(key 마다 조회 유무와 바꾸기 이름).
  - 단언: event 절에 `event.home.PicksCard.changed` 아래 `exempt api.home.ResultsCard.check — 결과는 사람이 「당첨 대조」를 눌러 받는다 — 누르기 전까지 앞선 결과를 그대로 보인다` 줄이 있다. 스냅숏을 새로 찍는다.

- [ ] **Step 2: 걷어낸다.** 위 Delete 목록을 지우고, `layout.tsx` 에서 `AppContainer` 를 빼고, `test.setup.ts` 에서 `@composition/screens` 를 뺀다. `@framework`·`@lib/di` 별칭을 지운다. `useSharedState` 를 라이브러리에서 지운다.

- [ ] **Step 3: 검사기를 정리한다.** 옛 store 를 짚던 규칙을 지운다: `hook-resolves-own-key-only`, `rule-targets-own-cache`, `no-renamed-store-import`, `no-path-literal`, `middleware-sees-infrastructure-lib-routes-only` 의 route 예외, `framework-reaches-lib-only`, `screen-reaches-store-through-framework`, `nothing-reaches-composition` 의 `AppContainer`·`routes` 예외, `STORE_OUTSIDE_ACTION`. 새로 거는 근사 검사 하나: 「creator 맨 위(함수 본문 밖)에서 `ctx(…)` 를 부르면 그 결과로 `.on`·`.exempt` 만 부른다」. 지운 규칙의 표본을 지우고 새 규칙의 위반·허용 표본을 둔다.

- [ ] **Step 4: 문서를 고친다.**
  - `CLAUDE.md` 「이 저장소가 정한 것」: 옛 store·컨테이너·`StoreProvider`·`propagation` 서술을 지우고, 자원·event·`infra.http`·`overrideStore`·등록을 싣는 자리·key 규칙을 적는다. 「명령어」의 `pnpm check` 설명과 검사 규칙 목록을 실제와 맞춘다.
  - vault 보고 문서에 한 줄: 「store 2단계 — 영역·컨테이너·전파 규칙 파일·route 를 걷어내고 자원·event store 로 바꿨다. vault 골조 문서는 단계가 끝난 뒤 한 번에 고친다」.

- [ ] **Step 5: 확인한다**
  - `pnpm check` 통과
  - `bash tools/checks/run-violations.sh` 모든 줄 OK
  - `rg "@framework|@lib/di|StoreProvider|createContainer|useSharedState|declare module \"@lib/store\"" apps packages --glob '!**/node_modules/**'` → 0
  - `pnpm --filter @fortuna-lottery/web build` 성공

- [ ] **Step 6: 커밋하고 push 한다** — `refactor(web): 옛 store 를 걷어내고 출력 스냅숏과 문서를 맞춘다`
