# 화면 앱을 store 로 옮긴다 (vault 화면 골조 개정 3 맞춤) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web` 의 중앙 관리 자리 셋(컨테이너 등록·전파 규칙·주소 목록)을 vault 화면 골조 개정 3 의 store 로 옮긴다. 화면에 보이는 동작은 바꾸지 않는다.

**Architecture:** 먼저 범용 store(`shared/lib/store/`)를 옆에 깔고 시험으로 굳힌다. 그다음 한 번에 넘어간다. action 열한 개가 자기 자리에서 `store.cache`·`store.http` 로 등록하고, 전파 규칙은 낡는 쪽 캐시의 파일이 `store.invalidates`·`store.unaffected` 로 선언하며, `composition/` 은 유스케이스를 모르는 `createContainer`·`screens.ts`·`routes.ts` 와 `describe()` 스냅숏만 갖는다. 마지막에 검사기 규칙 넷과 표본, 문서를 맞춘다.

**Tech Stack:** Next.js 15.5 · React 19 · TypeScript · Vitest(jsdom) · dependency-cruiser · ESLint(typescript-eslint)

**Spec:** vault 설계 [화면 앱 골조 개정 3 설계 — 중앙 관리 자리를 store 로 추상화한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/superpowers/specs/2026-10-20-web-store-design.md>) 와, 그 설계로 고친 vault 골조 문서 넷이 정본이다. 실행자는 아래를 함께 읽는다(이 기기의 동일 사본이고 고치지 않는다).

- [frontend-app-layers](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md>) — [§4.1 `shared/lib/store/` — 범용 store](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#41-sharedlibstore--범용-store>), [§5.1 컨테이너를 짓는다 — store 의 정의에서](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#51-컨테이너를-짓는다--store-의-정의에서>), [§5.5 등록이 빠지지 않게 — screens.ts 와 스냅숏](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#55-등록이-빠지지-않게--screensts-와-스냅숏>), [§6 전파 규칙 — store 의 event 영역](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#6-전파-규칙--store-의-event-영역>), [§7 주소 — store 의 route 영역](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#7-주소--store-의-route-영역>)
- [frontend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md>) — [§3.2 조회 action — cache 영역에 등록하고 꺼내는 훅](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#32-조회-action--cache-영역에-등록하고-꺼내는-훅>), [§3.3 바꾸는 action — http 영역에 등록하고 사건을 낸다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#33-바꾸는-action--http-영역에-등록하고-사건을-낸다>), [§8 공개 표면 — index.ts 가 불러오는 것](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#8-공개-표면--indexts-가-불러오는-것>)
- [fractal-view-promotion](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md>) — [§6 공개 표면 — 폴더 밖에서는 `index` 만 본다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md#6-공개-표면--폴더-밖에서는-index-만-본다>)
- [boundary-enforcement](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md>) — [§3 의존 규칙 — 설정 전문](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#3-의존-규칙--설정-전문>), [§4 코드 모양 규칙 — ESLint](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#4-코드-모양-규칙--eslint>), [§5 검사기 자체를 검증한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#5-검사기-자체를-검증한다>), [§6 어디서 도는가](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#6-어디서-도는가>)

**선행 조건 — 충족됐다.** vault 브랜치 `frontend-store+`(2fb9eb28)는 2026-10-20 에 vault `dev` 에 병합됐다(병합 커밋 d21408c5). 전역 동일 사본은 세션이 시작될 때 `origin/dev` 로 맞춰진다. 위 링크가 아직 개정 2 를 보이면 사본이 맞춰지기 전이다. 그때는 `git -C C:/Users/hnpark/orca/workspaces/vaults/global show origin/dev:<경로>` 로 개정 3 을 읽는다.

## Global Constraints

- 화면에 보이는 동작·문구는 바꾸지 않는다. **action 훅이 돌려주는 객체의 모양(필드 이름과 타입)은 그대로 둔다.** 그래서 표시 조정자와 그 시험은 손대지 않는다(공급자를 짓는 시험 둘만 고친다).
- 새 의존 패키지를 들이지 않는다.
- `apps/web` 의 코드 관례(큰따옴표, 세미콜론)를 따른다. vault 예시의 작은따옴표는 옮기지 않는다.
- key 는 `<영역>.<도메인>.<이름>` 꼴이다. 둘째 마디는 계약·서버 모듈과 같은 도메인 이름이다. 정확한 key 는 아래 「key 표」가 정한다.
- 이 저장소가 이미 고쳐 둔 동작 셋을 지킨다: `FetchHttpClient` 의 `{ error }` 문구, `serverCache.invalidate` 의 `queries.has(key)`, 조회 훅의 `readOnServer`(CLAUDE.md 「규격 코드와 다르게 지킨 것이 셋 있다」).
- 매 Task 끝에 `pnpm check` 가 통과한다. Task 3 부터는 `bash tools/checks/run-violations.sh` 도 통과한다.
- 커밋 메시지는 `feat(web):`·`refactor(web):`·`chore(checks):`·`docs:` 접두에 한국어 본문을 쓰고, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 를 붙인다.
- 작업 브랜치와 워크트리는 실행 시점에 `git-strategy` 스킬로 정한다(이름 예: `web-store+`). 이 저장소는 `orca worktree create --name <이름>` 을 쓴다.
- 이 계획 문서는 구현 전에 먼저 커밋한다(CLAUDE.md 「superpowers 스킬 워크플로 — 계획/스펙 문서 선(先) 커밋」).
- 하지 않는 것: 위젯·`middleware.ts`·놀이터·가짜 서버·개발자 패널(아직 없다), 캐시 라이브러리, 서버 앱(NestJS).

## Review Focus

1. **픽을 저장·삭제하면 픽 목록은 다시 받고, 당첨 대조 결과는 다시 받지 않는다.** 전파 규칙이 파일마다 흩어져도 이 동작은 그대로여야 한다. Task 2 의 `listPicks.action.test.ts`·`checkResults.action.test.ts` 가 지킨다.
2. **저장이 실패하면 사건이 나지 않는다.** 그래서 목록도 다시 받지 않는다. Task 2 의 `savePick.action.test.ts` 가 지킨다.
3. **컨테이너는 시험마다 새것이다.** 앞 시험의 캐시 값이 다음 시험에 새면 안 된다. Task 2 의 `createContainer.test.ts` 가 지킨다.
4. **빠진 등록은 조용히 지나가지 않고 key 이름을 담은 오류로 즉시 실패한다.** 꺼내기·`route(key)`·`emit`, 그리고 등록되지 않은 사건이나 캐시를 가리키는 전파 규칙이 그렇다. 전파 규칙은 컨테이너를 지을 때 실패한다. Task 1 의 `store.test.ts` 가 지킨다.
5. **개발 모드에서는 같은 key 의 재등록이 덮어쓰고, 운영 빌드에서는 실패한다.** 개발 서버에서 저장할 때마다 오류가 나면 안 된다. Task 1 의 `store.test.ts` 가 지킨다.

---

## key 표

한 행은 「이 파일이 이 key 를 이 영역에 등록하고, 지금은 이 토큰과 짓는 법이 그 자리에 있다」로 읽는다. 경로의 뿌리는 `apps/web/src/app/(home)/` 다.

| 등록하는 파일 | 등록하는 key | 영역 | 지금 그 자리에 있는 토큰과 짓는 법 |
|---|---|---|---|
| `StatisticsPanel/_action/getStatistics.action.ts` | `cache.statistics.get` | cache | `STATISTICS` · `createStatisticsCache` |
| `LotterietusCard/_action/getLotterietusStatus.action.ts` | `cache.lotterietus.status` | cache | `LOTTERIETUS_STATUS` · `createLotterietusStatusCache` |
| `PicksCard/_action/listPicks.action.ts` | `cache.picks.list` | cache | `LIST_PICKS` · `createListPicksCache` |
| `ResultsCard/_action/checkResults.action.ts` | `cache.results.check` | cache | `CHECK_RESULTS` · `createCheckResultsCache` |
| `HypothesisLab/_action/checkPopularity.action.ts` | `cache.hypothesis.popularity` | cache | `CHECK_POPULARITY` · `createPopularityCache` |
| `PicksCard/_action/savePick.action.ts` | `http.picks.save`, `event.picks.saved` | http, event | `SAVE_PICK` · `createSavePick` · `PICKS_SAVED` |
| `PicksCard/_action/deletePick.action.ts` | `http.picks.delete`, `event.picks.removed` | http, event | `DELETE_PICK` · `createDeletePick` · `PICKS_REMOVED` |
| `GeneratorCard/_action/generateCombination.action.ts` | `http.generator.generate` | http | `GENERATE_COMBINATION` · `createGenerateCombination` |
| `HypothesisLab/_action/evaluateAssumption.action.ts` | `http.hypothesis.evaluate` | http | `EVALUATE_ASSUMPTION` · `createEvaluateAssumption` |
| `HypothesisLab/_action/generateAssumed.action.ts` | `http.hypothesis.generate` | http | `GENERATE_ASSUMED` · `createGenerateAssumed` |
| `SimulationCard/_action/backtestCombination.action.ts` | `http.simulation.backtest` | http | `BACKTEST_COMBINATION` · `createBacktestCombination` |
| `routes.ts` (새 파일) | `route.home.index` | route | 없다 — 지금은 주소를 만드는 자리가 0 건이다 |

전파 규칙은 넷이고, 지금 `composition/propagation.ts` 의 두 줄과 주석 한 줄을 옮긴 것이다.

| 규칙을 다는 파일 | 사건 | 대상 캐시 | 선언 |
|---|---|---|---|
| `listPicks.action.ts` | `event.picks.saved` | `cache.picks.list` | `store.invalidates(…, { from: "tab" })` |
| `listPicks.action.ts` | `event.picks.removed` | `cache.picks.list` | `store.invalidates(…, { from: "tab" })` |
| `checkResults.action.ts` | `event.picks.saved` | `cache.results.check` | `store.unaffected(…, "결과는 사람이 「당첨 대조」를 눌러 받는다")` |
| `checkResults.action.ts` | `event.picks.removed` | `cache.results.check` | `store.unaffected(…, "결과는 사람이 「당첨 대조」를 눌러 받는다")` |

사건 값의 타입은 지금 것을 그대로 쓴다: `event.picks.saved` 는 `{ numbers: readonly number[] }`, `event.picks.removed` 는 `{ id: string }`.

## File Structure

Task 4 를 마친 뒤 `apps/web/src/` 에서 바뀌는 자리는 다음과 같다.

```
app/
  layout.tsx                 import "@composition/routes" 를 더한다
  AppContainer.tsx           ContainerProvider → StoreProvider
  (home)/
    index.ts                 _action/ 등록 파일 열한 줄을 불러오는 목록. 아무것도 내보내지 않는다
    routes.ts                새 파일 — route.home.index
    */_action/*.action.ts    store 등록 + useStore. create* 와 토큰 상수가 없어진다
    */index.tsx              _action 을 다시 내보내던 줄을 지운다(모델 타입 줄은 둔다)
composition/
  createContainer.ts         store.container 를 부르는 한 자리. 유스케이스별 줄이 없다
  screens.ts                 새 파일 — import "./routes"; import "@app/(home)";
  routes.ts                  새 파일 — import "@app/(home)/routes";
  store.describe.test.ts     새 파일 — describe() 스냅숏과 주소·폴더 대조
  propagation.ts(.test.ts)   지운다
infrastructure/
  http/index.ts              토큰 둘을 지우고 StoreDeps 에 http 를 덧붙인다
  events/                    DOMAIN_EVENTS 를 지우고 DomainEvents 가 EventChannel 을 구현한다
shared/lib/
  store/                     새 폴더 — store.ts · index.ts · react.tsx · store.test.ts
  di/                        지운다
```

---

### Task 1: 범용 store 를 깐다

**Files:**
- Create: `apps/web/src/shared/lib/store/store.ts`, `apps/web/src/shared/lib/store/index.ts`, `apps/web/src/shared/lib/store/react.tsx`
- Test: `apps/web/src/shared/lib/store/store.test.ts`

**Interfaces:**
- Produces (`@lib/store`, React 를 import 하지 않는다):
  - `interface StoreRegistry {}` · `interface StoreDeps {}` — 선언 병합 자리
  - `interface EventChannel { on(name: string, fn: (payload: unknown) => void): () => void; emit(name: string, payload?: unknown): void }`
  - `type KeyOf<A extends "cache" | "http" | "event" | "route">` · `type Emit` · `type ContainerDeps = StoreDeps & { events: EventChannel }`
  - `interface Container<D extends ContainerDeps = ContainerDeps> { readonly deps: D; resolve<K extends KeyOf<"cache"> | KeyOf<"http">>(key: K): StoreRegistry[K] }`
  - `const store` — `cache`·`http`·`event`·`invalidates`·`unaffected`·`route`·`describe()`·`container(deps)`. 서명은 [frontend-app-layers §4.1 `shared/lib/store/` — 범용 store](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#41-sharedlibstore--범용-store>) 그대로다
  - `function route<K extends KeyOf<"route">>(key: K): StoreRegistry[K]`
- Produces (`@lib/store/react`, `"use client"`): `StoreProvider({ container, children })`, `useStore<K extends KeyOf<"cache"> | KeyOf<"http">>(key: K): StoreRegistry[K]`
- Produces (시험 전용, `./store`): `createStore<R extends object, D extends object>(): { store: Store<R, D>; route: <K extends KeysIn<R, "route">>(key: K) => R[K] }`

이 Task 에서 정하는 것 셋이 vault 가 짓는 쪽에 맡긴 자리다.

- **`Container.resolve(key)` 를 둔다.** `useStore` 가 이것으로 꺼내고, 시험도 훅 없이 캐시와 요청을 꺼낼 때 이것을 쓴다. 화면 쪽 코드에는 컨테이너가 닿지 않으므로(`useStore` 만 있다) 로케이터 구멍이 되지 않는다.
- **store 는 `createStore<R, D>()` 로 짓고, `index.ts` 가 `createStore<StoreRegistry, StoreDeps>()` 하나를 내보낸다.** store 자신의 시험이 앱 등록부를 더럽히지 않고 빈 store 를 새로 짓게 하려는 것이다. `createStore` 는 `index.ts` 에서 내보내지 않는다.
- **전파 규칙은 이미 지어진 캐시 인스턴스만 무효화한다.** 아무도 꺼내지 않은 캐시를 사건 때문에 새로 짓지 않는다.

`describe()` 의 꼴은 아래로 확정한다. 영역은 `cache`·`http`·`event`·`route` 순으로 늘 다 찍고, 각 영역 안은 key 순이다. 사건 아래에는 `낡게 한다` 줄을 대상 key 순으로, 그다음 `일부러 낡게 하지 않는다` 줄을 대상 key 순으로 둔다.

```
[cache]
cache.t.list
[http]
http.t.save
[event]
event.t.saved (from: tab)
  낡게 한다: cache.t.list (from: tab)
  일부러 낡게 하지 않는다: cache.t.other — 사람이 누를 때 받는다
[route]
route.t.index
```

오류 문구는 아래로 확정한다. 시험이 이 문구로 판정한다.

| 이 자리에서 | 이 문구로 실패한다 |
|---|---|
| 운영 빌드에서 같은 key 를 두 번 등록할 때 | `같은 key 를 두 번 등록했다: <key>` |
| 등록되지 않은 key 를 `resolve`·`route` 로 꺼낼 때 | `등록되지 않은 key 다: <key>` |
| `store.event` 로 등록되지 않은 사건을 `emit` 할 때, 그런 사건을 가리키는 전파 규칙이 있는 채로 `container()` 를 부를 때 | `등록되지 않은 사건이다: <key>` |
| `store.cache` 로 등록되지 않은 캐시를 가리키는 전파 규칙이 있는 채로 `container()` 를 부를 때 | `등록되지 않은 key 다: <key>` |
| 공급자 밖에서 `useStore` 를 부를 때 | `StoreProvider 밖에서 꺼냈다: <key>` |

- [ ] **Step 1: `store.test.ts` 에 실패하는 시험을 쓴다**

시험은 `createStore<Reg, Deps>()` 로 빈 store 를 지어 쓴다. `Reg` 는 `"cache.t.list"`·`"cache.t.other"`(값 `{ invalidate(): void; n: number }`), `"http.t.save"`(값 `(n: number) => Promise<void>`), `"event.t.saved"`(값 `{ n: number }`), `"route.t.index"`(값 `() => string`), `"route.t.detail"`(값 `(id: string) => string`)를 갖는 지역 인터페이스이고, `Deps` 는 `{ http: { tag: string } }` 다. 시험 이름과 판정은 이렇다.

- `"cache 는 처음 꺼낼 때 한 번 짓고 같은 인스턴스를 내준다"` — 짓는 콜백이 `vi.fn` 이고 `resolve` 두 번에 한 번 불린다. 두 결과가 `toBe` 같다.
- `"컨테이너가 다르면 인스턴스도 다르다"` — 같은 store 에서 지은 컨테이너 둘의 `resolve("cache.t.list")` 가 `not.toBe`.
- `"등록 콜백은 deps 를 받되 사건 통로는 받지 않는다"` — cache 콜백 인자에 `http` 가 있고 `"events" in deps` 가 거짓이다. http 콜백 인자에는 `emit` 이 함수로 있다.
- `"emit 은 등록된 사건만 사건 통로로 낸다"` — `store.event("event.t.saved", { from: "tab" })` 뒤 http 콜백의 `emit("event.t.saved", { n: 1 })` 이 `deps.events.on` 으로 건 듣기에 `{ n: 1 }` 로 닿는다. `store.event` 없이 `emit` 하면 `"등록되지 않은 사건이다: event.t.saved"` 로 던진다.
- `"invalidates 는 사건이 나면 지어진 캐시만 무효화한다"` — 사건을 내기 전에 `resolve` 한 캐시의 `invalidate` 가 한 번 불리고, 꺼내지 않은 `cache.t.other` 의 짓는 콜백은 불리지 않는다.
- `"unaffected 는 무효화하지 않고 describe 에만 실린다"` — 사건을 내도 `cache.t.other.invalidate` 가 불리지 않는다.
- `"전파 규칙이 등록되지 않은 사건이나 캐시를 가리키면 container 가 key 이름으로 실패한다"` — 두 경우의 문구가 위 표대로다.
- `"등록되지 않은 key 를 꺼내면 key 이름으로 실패한다"` — `resolve("cache.t.list")` 와 `route("route.t.index")` 가 `"등록되지 않은 key 다: …"`.
- `"route 는 공급자 없이 등록된 주소 함수를 돌려준다"` — `route("route.t.detail")("7")` 이 `"/t/7"`.
- `"개발 모드에서 같은 key 를 다시 등록하면 뒤의 것이 이긴다"` — `NODE_ENV` 가 `test` 인 채로 같은 key 를 두 번 등록해도 던지지 않고, 새 컨테이너가 뒤 콜백으로 짓는다.
- `"운영 빌드에서 같은 key 를 다시 등록하면 실패한다"` — `vi.stubEnv("NODE_ENV", "production")` 뒤 두 번째 `store.cache` 가 `"같은 key 를 두 번 등록했다: cache.t.list"` 로 던진다. `afterEach` 에서 `vi.unstubAllEnvs()`.
- `"describe 는 영역별로 key 순으로 찍는다"` — 위 꼴의 문자열과 `toBe` 로 같다(등록은 일부러 역순으로 한다).
- `"useStore 는 공급자의 컨테이너에서 꺼내고 밖에서는 실패한다"` — `renderHook` 과 `StoreProvider` 래퍼로 `resolve` 와 같은 인스턴스가 나오고, 래퍼 없이 부르면 `"StoreProvider 밖에서 꺼냈다: cache.t.list"`. 이 시험만은 `index.ts` 의 앱 store 대신 시험 store 의 컨테이너를 `StoreProvider` 에 넘긴다 — `useStore` 는 받은 컨테이너의 `resolve` 를 부를 뿐이므로 어느 store 의 것이든 같다.

- [ ] **Step 2: 시험이 실패하는지 본다**

Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/shared/lib/store`
Expected: FAIL — `./store` 를 찾지 못한다.

- [ ] **Step 3: `store.ts`·`index.ts`·`react.tsx` 를 짓는다**

- `store.ts` 는 정의 다섯 묶음(cache·http·event·rule·route)을 `Map` 으로 쥔다. 규칙의 key 는 `${사건} ${캐시}` 짝이다. 재등록 판정은 등록하는 순간 `process.env.NODE_ENV === "production"` 을 본다.
- `container(deps)` 는 규칙의 사건·캐시가 모두 등록됐는지 먼저 확인하고, 규칙마다 `deps.events.on(사건, …)` 을 건 뒤 컨테이너를 돌려준다. 인스턴스는 컨테이너 안 `Map` 에 쥔다. 콜백에 넘기는 인자는 `deps` 에서 `events` 를 뺀 것이고, http 콜백에는 `emit` 을 더한다.
- `index.ts` 는 `StoreRegistry`·`StoreDeps`·`EventChannel` 과 타입들을 선언하고 `const { store, route } = createStore<StoreRegistry, StoreDeps>()` 를 내보낸다. React 를 import 하지 않는다.
- `react.tsx` 는 `"use client"` 이고 `createContext<Container | null>` 하나로 `StoreProvider`·`useStore` 를 낸다.

- [ ] **Step 4: 시험이 통과하는지 본다**

Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/shared/lib/store`
Expected: PASS — 13 개.

- [ ] **Step 5: 전체 검증을 돌린다**

Run: `pnpm check`
Expected: 통과. store 는 아직 아무도 쓰지 않는다.

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/shared/lib/store
git commit -m "feat(web): 범용 store 를 shared/lib/store 에 깐다"
```

---

### Task 2: 화면 앱을 store 로 넘긴다

컨테이너는 둘 중 하나만 설 수 있으므로 action·조립 루트·infrastructure·시험·의존 규칙을 한 Task 에서 함께 넘긴다. 의존 규칙과 ESLint 는 **실제 코드가 통과하는 데 필요한 만큼만** 여기서 고치고, 새 ESLint 규칙과 표본은 Task 3 이 갖는다.

**Files:**
- Modify: `apps/web/src/infrastructure/http/index.ts`, `apps/web/src/infrastructure/events/DomainEvents.ts`, `apps/web/src/infrastructure/events/index.ts`
- Modify: key 표의 action 열한 개, `apps/web/src/app/(home)/*/index.tsx` 일곱 개, `apps/web/src/app/(home)/index.ts`
- Create: `apps/web/src/app/(home)/routes.ts`, `apps/web/src/composition/screens.ts`, `apps/web/src/composition/routes.ts`, `apps/web/src/composition/store.describe.test.ts`
- Modify: `apps/web/src/composition/createContainer.ts`, `apps/web/src/app/AppContainer.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/next.config.ts`
- Delete: `apps/web/src/composition/propagation.ts`, `apps/web/src/composition/propagation.test.ts`, `apps/web/src/shared/lib/di/`
- Test: `apps/web/src/composition/createContainer.test.ts`, `apps/web/src/app/(home)/PicksCard/_action/savePick.action.test.ts`, `apps/web/src/app/(home)/PicksCard/_action/listPicks.action.test.ts`(새 파일), `apps/web/src/app/(home)/ResultsCard/_action/checkResults.action.test.ts`(새 파일), `apps/web/src/app/(home)/HypothesisLab/_action/checkPopularity.action.test.ts`, `apps/web/src/app/(home)/HypothesisLab/HypothesisLab.presenter.test.ts`
- Modify: `.dependency-cruiser.cjs`, `apps/web/eslint.config.mjs`

**Interfaces:**
- Consumes: Task 1 의 `store`·`route`·`Container`·`EventChannel`·`StoreProvider`·`useStore`
- Produces: `createContainer(env: "test"): Container<{ http: TestHttpClient; events: DomainEvents }>` 와 `createContainer(env: Binding): Container` 의 오버로드. key 표의 key 열두 개와 사건 둘

- [ ] **Step 1: 실패하는 시험을 쓴다**

- `createContainer.test.ts` 를 다시 쓴다. `"test 환경은 deps.http 에 TestHttpClient 를 꽂는다"`(`toBeInstanceOf(TestHttpClient)`), `"real 환경은 FetchHttpClient 를 꽂는다"`, `"fake 환경은 아직 준비되지 않았다는 오류로 실패한다"`(그대로), `"두 번 지은 컨테이너는 서로 다른 캐시를 쥔다"`(`c1.resolve("cache.picks.list")` 가 `c2` 의 것과 `not.toBe`). 이 시험만은 `TestHttpClient`·`FetchHttpClient` 를 `@infrastructure/http` 에서 값으로 가져온다 — `composition/` 의 시험이라 의존 규칙이 막지 않는다.
- `listPicks.action.test.ts` 에 지금 `propagation.test.ts` 의 앞 두 시험을 옮긴다. `"픽을 저장하면 목록 캐시가 다시 받는다"`, `"픽을 지우면 목록 캐시가 다시 받는다"`. 응답은 `c.deps.http.respond`, 요청은 `c.resolve("http.picks.save")`·`c.resolve("http.picks.delete")`, 판정은 지금처럼 `http.sent` 의 GET 개수가 2 다.
- `checkResults.action.test.ts` 에 셋째 시험 `"픽을 저장해도 당첨 대조 캐시는 다시 받지 않는다"` 를 옮기고, 같은 꼴로 `"픽을 지워도 당첨 대조 캐시는 다시 받지 않는다"` 를 더한다. `/api/results` 의 GET 이 1 번에 머문다.
- `savePick.action.test.ts` 는 `c.deps.http.respond(...)`, `c.deps.events.on("event.picks.saved", heard)`, `c.resolve("http.picks.save")` 로 바꾼다. 판정은 그대로다.
- `composition/store.describe.test.ts` 를 만든다. `import "./screens"` 뒤 `"store 에 등록된 전부"` 가 `expect(store.describe()).toMatchSnapshot()` 이다. 같은 파일의 `"page.tsx 를 가진 폴더마다 주소가 있고 주소마다 폴더가 있다"` 는 `node:fs` 로 `src/app` 을 훑어 `page.tsx` 를 가진 폴더를 모으되 `api`·`(dev)` 는 빼고, 라우트 그룹 마디는 지우고 `[x]` 마디는 `"x"` 로 바꿔 주소 집합을 만든다. `describe()` 의 `[route]` 아래 key 마다 `route(key)(...Array(fn.length).fill("x"))` 로 주소 집합을 만든다. 두 집합이 `toEqual` 같다(정렬해 비교한다). 지금은 둘 다 `["/"]` 다.

- [ ] **Step 2: 시험이 실패하는지 본다**

Run: `pnpm --filter @fortuna-lottery/web test`
Expected: FAIL — `c.deps`·`c.resolve("cache.picks.list")` 가 없고, `./screens` 를 찾지 못한다.

- [ ] **Step 3: infrastructure 를 store 쪽으로 돌린다**

- `infrastructure/http/index.ts` 에서 `token` import 와 `HTTP_CLIENT`·`TEST_HTTP` 를 지우고, `declare module "@lib/store" { interface StoreDeps { http: HttpClient } }` 를 더한다.
- `DomainEvents` 는 `implements EventChannel`(`import type { EventChannel } from "@lib/store"`). `events/index.ts` 는 `export { DomainEvents } from "./DomainEvents";` 한 줄이 된다.

- [ ] **Step 4: action 열한 개를 등록과 `useStore` 로 바꾼다**

본보기는 [frontend-module-layout §3.2 조회 action — cache 영역에 등록하고 꺼내는 훅](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#32-조회-action--cache-영역에-등록하고-꺼내는-훅>)과 [§3.3 바꾸는 action — http 영역에 등록하고 사건을 낸다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#33-바꾸는-action--http-영역에-등록하고-사건을-낸다>)다. 파일마다 할 일은 같다.

- 토큰 상수와 `create*` 함수를 지운다. `create*` 의 몸은 그대로 `store.cache(key, ({ http }) => …)` 또는 `store.http(key, ({ http, emit }) => …)` 의 콜백 몸이 된다.
- `declare module "@lib/store" { interface StoreRegistry { … } }` 로 key 와 값 타입을 올린다. cache 의 값 타입은 `ReturnType<typeof createServerCache<Q, V>>` 로, 지금 `createServerCache` 에 넘기는 `Q`·`V` 그대로다. http 의 값 타입은 지금 `create*` 가 돌려주는 함수의 서명을 그대로 적는다.
- `savePick`·`deletePick` 은 `store.event(key, { from: "tab" })` 를 등록하고, `events.emit(PICKS_SAVED, …)` 를 `emit("event.picks.saved", { numbers })` 로 바꾼다. `PicksSaved`·`PicksRemoved` 인터페이스는 지운다(값 타입은 등록부에 있다).
- 전파 규칙 넷을 「key 표」의 둘째 표대로 단다. `checkResults.action.ts` 의 주석 가운데 `composition/propagation.ts` 를 가리키는 줄은 지운다(이제 `store.unaffected` 가 그것을 말한다).
- 훅 맨 앞의 `useResolve(TOKEN)` 을 `useStore("<key>")` 로 바꾼다. 등록 함수는 `@lib/store` 에서, `useStore` 는 `@lib/store/react` 에서 가져온다. `@infrastructure/http`·`@infrastructure/events` 에서 가져오던 `import type` 은 지운다.
- 훅이 돌려주는 객체는 한 글자도 바꾸지 않는다.

- [ ] **Step 5: 공개 표면과 주소 등록을 바꾼다**

- `app/(home)/index.ts` 는 열한 줄의 부수효과 import 목록이 된다: `import "./GeneratorCard/_action/generateCombination.action";` 처럼 key 표의 첫 열 순서로 적고, 머리 주석은 「공개 표면 — 이 화면 모듈의 _action/ 등록 파일을 불러오는 목록. 뷰와 routes.ts 는 불러오지 않는다 (frontend-module-layout §8)」로 바꾼다.
- 자식 뷰 `index.tsx` 일곱 개에서 `./_action/` 을 다시 내보내는 줄을 지운다. 모델 타입을 내보내는 줄은 둔다.
- `app/(home)/routes.ts` 는 `declare module` 로 `"route.home.index": () => Route` 를 올리고 `store.route("route.home.index", () => "/")` 를 등록한다. `Route` 는 `import type { Route } from "next"`.
- `next.config.ts` 에 `typedRoutes: true` 를 더한다(Next 15.5 는 최상위 키다). `.next` 를 지운 채 `pnpm --filter @fortuna-lottery/web typecheck` 가 통과하지 않으면 `apps/web/package.json` 의 `typecheck` 를 `next typegen && tsc --noEmit` 으로 바꾼다.

- [ ] **Step 6: 조립 루트와 셸을 바꾼다**

- `createContainer.ts` 는 [frontend-app-layers §5.1 컨테이너를 짓는다 — store 의 정의에서](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#51-컨테이너를-짓는다--store-의-정의에서>)의 코드 그대로다. 맨 위에 `import "./screens";`, 유스케이스별 줄 없음, `store.container({ http, events: new DomainEvents() })`.
- `screens.ts` 는 `import "./routes";` 와 `import "@app/(home)";` 두 줄, `routes.ts` 는 `import "@app/(home)/routes";` 한 줄이다.
- `AppContainer.tsx` 는 `ContainerProvider` 를 `@lib/store/react` 의 `StoreProvider` 로 바꾼다. `layout.tsx` 맨 위에 `import "@composition/routes";` 를 더한다.
- `checkPopularity.action.test.ts`·`HypothesisLab.presenter.test.ts` 의 `ContainerProvider` 를 `StoreProvider` 로, `container.resolve(TEST_HTTP)` 를 `container.deps.http` 로 바꾼다.
- `composition/propagation.ts`·`propagation.test.ts` 와 `shared/lib/di/` 를 `git rm` 한다.

- [ ] **Step 7: 실제 코드가 지나도록 의존 규칙과 ESLint 를 맞춘다**

`.dependency-cruiser.cjs` 의 화면 앱 규칙을 [boundary-enforcement §3 의존 규칙 — 설정 전문](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#3-의존-규칙--설정-전문>)에 맞춘다. 바뀌는 것은 다섯 자리다.

- `no-deep-screen-or-widget-import` 를 네 벌로 나눈다. 첫 벌의 `from` 에서 `composition` 을 빼고, `composition/screens.ts`·`composition/routes.ts`·나머지 조립 루트의 세 벌을 더한다.
- `screen-must-not-reach-screen` 의 화면 모듈 벌과 위젯 벌에서 `` `^${APP}/routes\\.ts$` `` 예외를 지운다(그 파일은 없다).
- `nothing-reaches-composition` 의 예외에 `app/layout.tsx`·`(middleware|proxy).ts` 를 더하고, `layout.tsx` 가 `composition/routes.ts` 만 보게 하는 둘째 벌을 더한다.
- `screen-sees-infrastructure-types-only` 에서 `\.test\.tsx?$` 예외와 `dependencyTypesNot: ['type-only']` 를 지우고, `pathNot` 을 `serverCache\\.ts$` 로 좁힌다. 이제 화면 쪽은 타입으로도, 시험에서도 HTTP 포트와 사건 통로를 보지 않는다.
- `middleware-sees-infrastructure-lib-routes-only` 의 허용을 `` `^${APP}/routes\\.ts$` `` 에서 `^apps/web/src/composition/routes\\.ts$` 로 바꾼다.

`apps/web/eslint.config.mjs` 는 두 자리다.

- `RESOLVE_OUTSIDE_ACTION`·`RESOLVE_INFRA_TOKEN` 의 `useResolve` 를 `useStore` 로 바꾸고, `RESOLVE_INFRA_TOKEN` 은 지운다(토큰이 없다). Task 3 이 key 대조 규칙으로 그 자리를 채운다.
- 이 저장소가 더한 `VIEW_FOLDER_SURFACE` 는 라우트 폴더의 `index.ts` 가 `./<View>/_action/…` 을 짚는 것을 막는다. `src/app/**/index.ts` 만 고르는 블록을 `src/app/**/*.{ts,tsx}` 블록 뒤에 두고, 그 블록의 `no-restricted-imports` 는 `ROOT_ALIAS` 하나만 싣는다. 자식 뷰 폴더의 `index.tsx` 는 확장자가 달라 이 블록에 걸리지 않는다.
- `PATH_LITERAL` 의 문구를 `주소는 @lib/store 의 route(key) 로 만든다 (no-path-literal)` 로 바꾼다.
- 맨 뒤에 `files: ["src/shared/lib/store/store.test.ts"]` 블록을 두고 `"no-restricted-syntax": "off"` 를 건다. store 자신의 시험은 `it` 안에서 등록하고 `useStore` 를 직접 부르는 것이 일이라, `useStore` 금지와 Task 3 의 최상단 등록 선택자에 걸린다.

- [ ] **Step 8: 시험과 스냅숏을 확인한다**

Run: `pnpm --filter @fortuna-lottery/web test`
Expected: PASS. 새로 생긴 `src/composition/__snapshots__/store.describe.test.ts.snap` 을 열어 cache 다섯·http 여섯·event 둘(각각 `낡게 한다` 한 줄과 `일부러 낡게 하지 않는다` 한 줄)·route 하나가 실렸는지 눈으로 본다.

- [ ] **Step 9: 전체 검증을 돌린다**

Run: `pnpm check`
Expected: 통과. 그다음 `rg -n "@lib/di|useResolve|TEST_HTTP|HTTP_CLIENT|DOMAIN_EVENTS|propagation" apps/web/src` 가 0 건이다.

- [ ] **Step 10: 화면에서 확인한다**

`pnpm dev` 로 띄워 픽 저장·삭제가 목록을 바꾸고, 「당첨 대조」 결과가 저장 뒤에도 그대로인지 본다. 브라우저 콘솔에 `등록되지 않은` 이 없어야 한다.

- [ ] **Step 11: 커밋한다**

```bash
git add -A apps/web .dependency-cruiser.cjs
git commit -m "refactor(web): action 이 store 에 스스로 등록하고 전파 규칙과 주소를 store 로 옮긴다"
```

---

### Task 3: 검사기 규칙 넷과 표본을 store 에 맞춘다

**Files:**
- Modify: `apps/web/eslint.config.mjs`, `tools/checks/run-violations.sh`, 루트 `package.json`
- Create: `tools/checks/no-side-effects-false.mjs`
- Create/Delete: `tools/checks/{violations,allowed,eslint-violations,eslint-allowed,package-violations}/` 아래 표본

**Interfaces:**
- Consumes: Task 2 의 코드 꼴(`store.cache("<key>", …)`, `useStore("<key>")`)
- Produces: ESLint 규칙 `store/hook-resolves-own-key-only`·`store/rule-targets-own-cache`, 선택자 규칙 `store-registers-at-top-level`, 스크립트 `pnpm lint:side-effects`

규칙 넷은 이렇다. 설정 전문은 [boundary-enforcement §4 코드 모양 규칙 — ESLint](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#4-코드-모양-규칙--eslint>)와 [§6 어디서 도는가](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#6-어디서-도는가>)에서 복사한다.

| 규칙 | 지금 | 바뀐 뒤 |
|---|---|---|
| `hook-resolves-own-key-only` | `hook-resolves-own-token-only` — 토큰 이름 목록에 기댄 선택자 | action 밖 `useStore` 금지 선택자 + 같은 파일 등록과 대조하는 자체 규칙 |
| `store-registers-at-top-level` | 없다 | `store.*` 등록 호출이 `Program > ExpressionStatement` 바로 아래가 아니면 운다 |
| `rule-targets-own-cache` | 없다 | `store.invalidates`·`store.unaffected` 의 둘째 인자가 같은 파일의 `store.cache` key 가 아니면 운다 |
| `no-side-effects-false` | 없다 | `apps/web/package.json` 의 `"sideEffects": false` 를 막는 스크립트 |

- [ ] **Step 1: 표본을 먼저 둔다**

[boundary-enforcement §5 검사기 자체를 검증한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#5-검사기-자체를-검증한다>)의 트리에서 이 저장소에 없는 것을 더하고, 낡은 것을 고친다. 표본마다 첫 줄에 `// 사례: …` 주석을 단다.

- 더하는 의존 규칙 표본: `violations/no-deep-screen-or-widget-import--screens/`, `--routes/`, `violations/nothing-reaches-composition--layout/`, `violations/screen-sees-infrastructure-types-only--test/`. `violations/screen-sees-infrastructure-types-only/` 는 값 import 대신 `import type { HttpClient }` 꼴로 바꾼다(이제 타입도 막는다). 허용 표본 `allowed/no-deep-screen-or-widget-import--lists/`, `allowed/nothing-reaches-composition--server-routes/`.
- 지우는 표본: `allowed/screen-must-not-reach-screen--routes/`(`app/routes.ts` 꼴이 없어졌다), `eslint-violations/hook-resolves-own-token-only--infra-token/`.
- ESLint 위반 표본: `hook-resolves-own-token-only/` 를 `hook-resolves-own-key-only/` 로 `git mv` 하고 조정자가 `useStore` 를 부르게 고친다. `hook-resolves-own-key-only--other-key/`, `--route/`, `store-registers-at-top-level/`, `rule-targets-own-cache/` 를 더한다.
- ESLint 허용 표본: `hook-resolves-own-key-only--own-cache/`, `rule-targets-own-cache--other-screen-event/` 를 더하고, `no-path-literal--routes/` 를 `app/documents/routes.ts` 가 `store.route` 콜백으로 주소 문자열을 돌려주는 꼴로 바꾼다. 이 저장소의 예외로 `view-folder-public-surface--route-index/`(라우트 폴더 `index.ts` 가 `./DocumentList/_action/documentList.action` 을 불러온다)를 더한다.
- `package-violations/no-side-effects-false/apps/web/package.json` 에 `"sideEffects": false` 를 둔다.

- [ ] **Step 2: 표본이 실패하는지 본다**

Run: `bash tools/checks/run-violations.sh`
Expected: FAIL — `hook-resolves-own-key-only`·`store-registers-at-top-level`·`rule-targets-own-cache` 표본이 기대 문구로 울지 않는다. Task 2 에서 고친 의존 규칙 표본은 OK 다.

- [ ] **Step 3: ESLint 규칙과 검사 스크립트를 넣는다**

- `eslint.config.mjs` 에 `STORE_OUTSIDE_ACTION`(Task 2 의 `RESOLVE_OUTSIDE_ACTION` 을 이 이름과 문구로 바꾼다), `STORE_REGISTER_NESTED`, `storeCall`·`keyOf`·`ownKeyRule`·`STORE_KEYS` 를 vault 전문 그대로 옮긴다. 첫 블록에 `plugins: { store: STORE_KEYS }` 와 `"store/rule-targets-own-cache": "error"` 를, `*.action.ts` 블록에 `"store/hook-resolves-own-key-only": "error"` 를 건다. `no-restricted-syntax` 를 싣는 블록마다 `STORE_REGISTER_NESTED` 를 함께 싣는다 — 같은 규칙 이름은 뒤 블록이 앞 블록을 덮는다. 이 저장소가 더한 `VIEW_STATE_MEMBER` 는 그대로 둔다.
- `tools/checks/no-side-effects-false.mjs` 를 vault 전문 그대로 둔다. 루트 `package.json` 에 `"lint:side-effects": "node tools/checks/no-side-effects-false.mjs apps/web/package.json"` 를 더하고 `check` 를 `pnpm typecheck && pnpm lint && pnpm lint:deps && pnpm lint:side-effects && pnpm test && pnpm test:tools` 로 바꾼다.
- `run-violations.sh` 의 `EXPECT` 에서 토큰 규칙을 지우고 `[hook-resolves-own-key-only]='(hook-resolves-own-key-only)'`, `[store-registers-at-top-level]='(store-registers-at-top-level)'`, `[rule-targets-own-cache]='(rule-targets-own-cache)'` 를 더한다. 끝에 vault §5 뼈대의 `no-side-effects-false` 확인 세 줄을 더한다.

- [ ] **Step 4: 표본과 전체 검증을 돌린다**

Run: `bash tools/checks/run-violations.sh && pnpm check`
Expected: 모든 줄이 `OK` 이고 `exit 0`. `pnpm check` 통과.

- [ ] **Step 5: 커밋한다**

```bash
git add -A tools/checks apps/web/eslint.config.mjs package.json
git commit -m "chore(checks): store 규칙 넷(key 대조·최상단 등록·자기 캐시 규칙·sideEffects)과 표본을 둔다"
```

---

### Task 4: 문서를 맞춘다

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/reports/2026-10-13-vault-feedback.md`

- [ ] **Step 1: CLAUDE.md 를 고친다**

- 「아키텍처 — vault 골조를 가리킨다」의 코드 모양 규칙 목록에서 `hook-resolves-own-token-only` 를 `hook-resolves-own-key-only`·`store-registers-at-top-level`·`rule-targets-own-cache` 로 바꾸고, `"sideEffects": false` 를 `pnpm lint:side-effects` 가 막는다는 것을 더한다.
- 「이 저장소가 정한 것」의 컨테이너 줄을 「store 는 `shared/lib/store/` 에 있고 action 이 스스로 등록한다. 컨테이너는 `composition/createContainer.ts` 가 짓고 `app/AppContainer.tsx` 가 `StoreProvider` 로 내린다. 시험은 `createContainer('test')` 의 `c.deps.http` 와 `c.resolve(key)` 를 쓴다」로 바꾼다.
- 「`picks` 의 저장·삭제는 `results` 캐시를 무효화하지 않는다」의 근거를 `propagation.ts` 주석에서 `checkResults.action.ts` 의 `store.unaffected` 로 바꾸고, 무엇이 무엇을 갱신하는지는 `composition/__snapshots__/store.describe.test.ts.snap` 에서 읽는다고 적는다.
- 「명령어」의 `pnpm check` 설명에 `lint:side-effects` 를 넣는다.

- [ ] **Step 2: vault 보고 문서에 어긋남을 올린다**

`2026-10-13-vault-feedback.md` 에 항목 셋을 더한다.

- `Container` 에 `resolve(key)` 를 더했다. vault 는 시험이 `deps` 로 가짜 HTTP 를 꺼내는 길만 적고, 훅 없이 등록된 캐시·요청을 꺼내는 길은 적지 않는다. 전파 규칙 시험이 그 길을 필요로 한다.
- 이 저장소의 `VIEW_FOLDER_SURFACE` 규칙에 라우트 폴더 `index.ts` 예외를 두었다. vault 는 `index.ts` 가 자식 뷰 폴더의 `_action/` 을 직접 짚게 하는데, 그 꼴은 뷰 폴더 공개 표면 규칙과 부딪친다. vault 쪽 경계 검사 장이 이 겹침을 다루지 않는다.
- vault 의 ESLint 전문은 첫 블록이 `src/**` 전체에 `useStore` 금지와 최상단 등록 선택자를 건다. 그래서 `shared/lib/store` 자신의 시험이 걸린다. 이 저장소는 그 시험 파일 하나에서 `no-restricted-syntax` 를 껐다.

- [ ] **Step 3: 검증하고 커밋한다**

Run: `pnpm check`
Expected: 통과.

```bash
git add CLAUDE.md docs/superpowers/reports/2026-10-13-vault-feedback.md
git commit -m "docs: CLAUDE.md 를 store 구조에 맞추고 vault 보고에 어긋남 셋을 올린다"
```
