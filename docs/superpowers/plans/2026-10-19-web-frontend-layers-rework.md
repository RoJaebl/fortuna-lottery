# 화면 앱 골조 재작업 (frontend 2026-10-19 개정판 맞춤) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web` 을 vault 화면 골조 개정판(2026-10-19)의 층 배치·DI 컨테이너·사건 전파·라우트 폴더 화면 모듈 구조로 옮긴다. 화면에 보이는 동작은 바꾸지 않는다.

**Architecture:** 먼저 폴더를 옮기지 않은 채 범용 컨테이너(`shared/lib/di/`)·바깥과 맞닿는 구현(`infrastructure/`)·조립 루트(`composition/`)를 깐다. 그 위에서 action 열한 개를 「짓는 법 + 토큰 + 훅」 꼴로 바꾸고, picks 의 직접 무효화를 사건과 전파 규칙 파일로 옮긴다. 마지막에 `src/modules/` 를 `app/(home)/` 의 자식 뷰로 옮기고, 같은 커밋에서 검사기를 개정판 규칙으로 바꾼다.

**Tech Stack:** Next.js 15 · React 19 · TypeScript · Vitest(jsdom) · dependency-cruiser · ESLint(typescript-eslint)

**Spec:** 이 계획은 별도 설계 문서 없이 vault 골조 문서를 정본으로 삼는다. 실행자는 아래 문서를 함께 읽는다(이 기기의 동일 사본, 고치지 않는다).

- [frontend-app-layers](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md>) — 층 배치, 의존 방향, 별칭, 컨테이너, 조립 루트, 전파 규칙
- [frontend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md>) — action 의 짓는 법·토큰·훅, 사건, 공개 표면
- [fractal-view-promotion](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md>) — 라우트 폴더 안의 깊이, 소유물 폴더 이름
- [boundary-enforcement](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md>) — §3 의존 규칙 — 설정 전문, §4 코드 모양 규칙 — ESLint, §5 검사기 자체를 검증한다

사용자가 2026-10-19 에 정한 것은 둘이다.

1. **한 화면을 유지한다.** 탭은 라우트로 쪼개지 않는다. 화면 모듈은 `app/(home)/` 하나이고 위젯은 0개다.
2. **DI 컨테이너를 규격대로 도입한다.**

## Global Constraints

- 화면에 보이는 동작·문구는 바꾸지 않는다. **action 훅이 돌려주는 객체의 모양(필드 이름과 타입)은 그대로 둔다.** 그래서 표시 조정자와 그 시험은 import 경로 말고는 고치지 않는다.
- 새 의존 패키지를 들이지 않는다.
- 파일을 옮길 때는 `git mv` 를 쓴다. 이력이 이어져야 한다.
- 매 Task 끝에 `pnpm check` 가 통과한다. 이것이 과업 끝의 검증 명령이다(CLAUDE.md 「명령어」).
- 커밋 메시지는 이 저장소 관례대로 `feat(web):`·`refactor(web):`·`docs:` 접두에 한국어 본문을 쓰고, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 를 붙인다.
- 작업 브랜치와 워크트리는 실행 시점에 `git-strategy` 스킬로 정한다. 이 저장소는 `orca worktree create --name <이름>` 을 쓴다.
- 이 계획 문서는 구현 전에 먼저 커밋한다(CLAUDE.md 「superpowers 스킬 워크플로 — 계획/스펙 문서 선(先) 커밋」).
- 규격 코드와 이 저장소 코드가 다를 때 **이 저장소가 이미 고쳐 둔 동작을 지킨다.** 해당하는 자리는 셋이고 아래 Task 가 각각 다룬다.
  - 서버 본문의 `{error}` 문구를 꺼내는 것 — Task 1
  - 조건이 `void` 인 캐시의 `invalidate` — Task 1
  - `useSyncExternalStore` 의 세 번째 인자 `readOnServer` — Task 3
- 하지 않는 것: `app/routes.ts`(만드는 주소가 0건), 놀이터·가짜 서버·개발자 패널([frontend-app-layers §8 개발자용 자리](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#8-개발자용-자리>)가 「아직 짓지 않는다」고 한다), `widgets/`, `middleware.ts`, 디자인 케이스 정렬(별도 계획 — 사용자 결정 대기).

## Review Focus

1. **서버가 돌려준 도메인 오류 문구가 화면에 그대로 보여야 한다.** 중복 번호로 400 이 오면 「요청 실패 (400)」이 아니라 서버의 `error` 문구가 보여야 한다. 시험 위치는 Task 1 `fetchHttpClient.test.ts` 다.
2. **본문 없는 성공 응답(204, 빈 본문)에서 터지지 않아야 한다.** 픽 삭제가 그 경우다. 시험 위치는 Task 1 이다.
3. **픽을 저장·삭제해도 당첨 대조 결과는 다시 받지 않아야 한다.** 사람이 「당첨 대조」를 다시 누르기 전까지 앞선 결과를 보인다. 시험 위치는 Task 3 `propagation.test.ts` 다.
4. **컨테이너는 탭 하나에 하나이고, 시험마다 새것이어야 한다.** 앞 시험이 받아 둔 캐시 값이 다음 시험에 새면 안 된다. 시험 위치는 Task 2 `createContainer.test.ts` 다.
5. **번호 조합이 빠르게 바뀔 때 앞 조합의 인기 패턴 응답이 뒤 조합 자리에 보이면 안 된다.** 조합이 없으면 요청하지 않는다. 시험 위치는 Task 3 `checkPopularity.action.test.ts` 다.

---

## File Structure

Task 4 를 마친 뒤의 `apps/web/src/` 는 다음과 같다.

```
app/
  layout.tsx · AppContainer.tsx · globals.css · icon.svg
  api/[...path]/route.ts                 import 만 @infrastructure/apiProxy 로 바꾼다
  (home)/
    page.tsx · index.ts · Home.presenter.ts · Home.presenter.test.ts
    IdentityBadge.tsx · IdentityBadge.presenter.ts
    GeneratorCard/ HypothesisLab/ LotterietusCard/ PicksCard/ ResultsCard/ SimulationCard/ StatisticsPanel/
      index.tsx · <View>.presenter(.test).ts · _action/ _mapper/ _model/   (StatisticsPanel 은 자식 여덟 .tsx 를 평평하게 둔다)
composition/
  createContainer.ts · createContainer.test.ts · propagation.ts · propagation.test.ts
infrastructure/
  http/   http.port.ts · fetchHttpClient.ts · fetchHttpClient.test.ts · testHttpClient.ts · index.ts
  events/ DomainEvents.ts · DomainEvents.test.ts · index.ts
  serverCache.ts · serverCache.test.ts   ← shared/lib/ 에서 옮긴다
  apiProxy.ts · apiProxy.test.ts         ← shared/lib/ 에서 옮긴다
shared/
  lib/  di/(container.ts · container.test.ts · ContainerProvider.tsx · index.ts) · formatDate · lotto-colors · lotto-rules
  ui/   ball · card · tabs
```

지우는 것은 셋이다.

- `src/modules/` 전체 — 내용은 `app/(home)/` 로 옮긴다.
- `shared/lib/fetchJson.ts` 와 그 시험 — `FetchHttpClient` 가 흡수한다.
- `@/*` 별칭

---

### Task 1: 범용 컨테이너와 infrastructure 를 깐다

**Files:**
- Create: `apps/web/src/shared/lib/di/{container.ts, container.test.ts, ContainerProvider.tsx, index.ts}`
- Create: `apps/web/src/infrastructure/http/{http.port.ts, fetchHttpClient.ts, fetchHttpClient.test.ts, testHttpClient.ts, index.ts}`
- Create: `apps/web/src/infrastructure/events/{DomainEvents.ts, DomainEvents.test.ts, index.ts}`
- Move: `apps/web/src/shared/lib/serverCache(.test).ts` → `apps/web/src/infrastructure/serverCache(.test).ts`
- Move: `apps/web/src/shared/lib/apiProxy(.test).ts` → `apps/web/src/infrastructure/apiProxy(.test).ts`
- Modify: `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `tsconfig.depcruise.json` — 별칭 여섯을 더한다
- Modify: `apps/web/src/app/api/[...path]/route.ts`, 그리고 `serverCache` 를 가져오는 action 넷의 import

**Interfaces:**
- Produces:
  - `@lib/di` — `Token<T>`, `token<T>(name)`, `Container`(`register`·`resolve`), `ContainerProvider`, `useResolve<T>(t)`. 전문은 [frontend-app-layers §4.1 `shared/lib/di/` — 범용 컨테이너](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#41-sharedlibdi--범용-컨테이너>) 그대로다.
  - `@infrastructure/http` — `HttpClient { get<T>(path): Promise<T>; send<T>(path, init: RequestInit): Promise<T> }`, `FetchHttpClient`, `TestHttpClient`(`respond(path, answer)`, `sent`), `HTTP_CLIENT`, `TEST_HTTP`.
  - `@infrastructure/events` — `DomainEvents`(`on(name, fn): () => void`, `emit(name, payload?)`), `DOMAIN_EVENTS`.
  - `@infrastructure/serverCache` — `createServerCache`, `CacheEntry`. 지금 파일의 내용을 그대로 옮긴다.
  - `@infrastructure/apiProxy` — `proxyToApi`. 내용은 그대로 둔다.

- [ ] **Step 1: 별칭 여섯을 더한다.** 규격 표는 [frontend-app-layers §3 층 별칭](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#3-층-별칭>)이다. 이 Task 에서는 `@/*` 를 **함께 남긴다.** `src/modules/` 가 아직 있고 그것을 가리킬 별칭이 여섯 안에 없기 때문이다. `@/*` 는 Task 4 에서 지운다. `tsconfig.depcruise.json` 의 `paths` 에도 같은 여섯을 `apps/web/src/...` 기준으로 더한다.

- [ ] **Step 2: 실패하는 시험을 쓴다.**
  - `container.test.ts`
    - 「처음 꺼낼 때 한 번 짓고 같은 인스턴스를 내준다」: 팩토리 호출 횟수가 1 이고 두 번 꺼낸 값이 `toBe` 로 같다.
    - 「등록되지 않은 토큰은 이름을 담아 실패한다」: `toThrow('등록되지 않은 토큰이다: X')`.
  - `DomainEvents.test.ts` — 「낸 사건을 듣고, 푼 뒤에는 듣지 않는다」.
  - `fetchHttpClient.test.ts` — 지금 `shared/lib/fetchJson.test.ts` 의 경우를 옮기고 둘을 더한다. `fetch` 는 `vi.stubGlobal` 로 갈아 끼운다.
    - 「실패 응답의 본문 `{ error: '이미 같은 번호가 있습니다' }` 를 오류 문구로 던진다」
    - 「본문에 `error` 가 없으면 `요청 실패 (500)` 을 던진다」
    - 「204 이면 `undefined` 를 돌려준다」
    - 「성공인데 본문이 비어 있으면 `undefined` 를 돌려준다」
  - `TestHttpClient` 시험(같은 파일 또는 `testHttpClient.test.ts`) — 「응답을 정하지 않은 경로는 `시험이 응답을 정하지 않은 경로다: /api/x` 로 실패하고, 보낸 요청은 `sent` 에 쌓인다」.

- [ ] **Step 3: 시험이 실패하는지 돌린다.**
  Run: `pnpm --filter @fortuna-lottery/web test`
  Expected: 새 시험 파일들이 import 를 풀지 못해 FAIL 한다.

- [ ] **Step 4: 구현한다.** `di/`·`events/`·`testHttpClient.ts`·`http/index.ts` 는 규격 전문 그대로다. **`FetchHttpClient.send` 만 규격과 다르다.** 지금 `fetchJson` 의 동작을 그대로 따른다.
  - 본문을 `res.json().catch(() => null)` 로 읽는다.
  - `!res.ok` 이면 본문의 `error` 문자열을 던지고, 없으면 `` `요청 실패 (${res.status})` `` 를 던진다.
  - 성공이면 본문을 돌려준다. 204 와 빈 본문은 `null` 이 아니라 `undefined` 로 돌려준다.
  - 이 어긋남은 Task 5 에서 vault 보고 문서에 올린다.

- [ ] **Step 5: 파일을 옮기고 import 를 고친다.**
  - `git mv` 로 `serverCache`·`apiProxy` 와 그 시험을 옮긴다.
  - `route.ts` 는 `@infrastructure/apiProxy` 를, action 넷은 `@infrastructure/serverCache` 를 가져오게 한다.
  - `serverCache.ts` 머리 주석의 「action 이 모듈 수준에 하나씩 만들고」는 「조립 루트가 컨테이너에 한 번 짓고」로 고친다.
  - `fetchJson.ts` 는 이 Task 에서 남긴다. Task 3 에서 지운다.

- [ ] **Step 6: 검증한다.**
  Run: `pnpm check`
  Expected: 모두 통과한다. `serverCache.test.ts` 의 「조건이 없는(void) 캐시도 invalidate 하면 보고 있는 값을 다시 받고 알린다」가 여전히 통과해야 한다.

- [ ] **Step 7: 커밋한다.**
  `feat(web): 범용 컨테이너와 infrastructure 층을 깐다 — http·events·serverCache·apiProxy`

### Task 2: 조립 루트와 컨테이너 공급자

**Files:**
- Create: `apps/web/src/composition/{createContainer.ts, createContainer.test.ts, propagation.ts}`
- Create: `apps/web/src/app/AppContainer.tsx`
- Modify: `apps/web/src/app/layout.tsx`

**Interfaces:**
- Consumes: Task 1 의 `@lib/di`, `@infrastructure/http`, `@infrastructure/events`
- Produces:
  - `createContainer(env: Binding): Container`, `type Binding = 'real' | 'test' | 'fake'`
  - `registerPropagation(c: Container): void` — 이 Task 에서는 본문이 비어 있다. Task 3 이 채운다.
  - `AppContainer({ children })`

- [ ] **Step 1: 실패하는 시험을 쓴다** — `createContainer.test.ts`.
  - 「test 환경은 `HTTP_CLIENT` 에 `TEST_HTTP` 와 같은 인스턴스를 꽂는다」: `c.resolve(HTTP_CLIENT)` 가 `c.resolve(TEST_HTTP)` 와 `toBe` 로 같다.
  - 「real 환경은 `FetchHttpClient` 를 꽂는다」: `toBeInstanceOf(FetchHttpClient)`.
  - 「fake 환경은 아직 준비되지 않았다는 오류로 실패한다」.
  - 「두 번 지은 컨테이너는 서로 다른 인스턴스를 쥔다」: `resolve(DOMAIN_EVENTS)` 가 `not.toBe` 다(Review Focus 4).

- [ ] **Step 2: 시험이 실패하는지 돌린다.**
  Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/composition`
  Expected: FAIL

- [ ] **Step 3: 구현한다.**
  - `createContainer` 는 [frontend-app-layers §5.1 세 단계](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#51-세-단계>)의 1단계와 3단계만 둔다. 2단계 자리에는 빈 주석 줄을 둔다.
  - `AppContainer` 는 [frontend-app-layers §5.3 컨테이너를 내리는 자리 — 앱과 시험](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#53-컨테이너를-내리는-자리--앱과-시험>) 그대로 `useState(() => createContainer('real'))` 로 짓는다.
  - `layout.tsx` 는 지금의 `metadata`, `data-ground="paper"`, `body` 클래스를 그대로 두고 `children` 을 `<AppContainer>` 로 감싼다.

- [ ] **Step 4: ESLint 상태 금지 규칙에서 `AppContainer.tsx` 를 뺀다.** 지금 `src/app/**/*.tsx` 에 걸린 `VIEW_STATE` 가 `useState` 를 막는다. 규격 §4 코드 모양 규칙 — ESLint 도 셸의 `AppContainer.tsx` 를 뺀다. `ignores` 에 `src/app/AppContainer.tsx` 를 더한다.

- [ ] **Step 5: 검증한다.**
  Run: `pnpm check`
  Expected: 통과한다. `pnpm dev` 로 띄운 화면이 전과 같게 그려지는지도 한 번 손으로 확인한다.

- [ ] **Step 6: 커밋한다.**
  `feat(web): 조립 루트 createContainer 와 AppContainer 를 세운다`

### Task 3: action 열한 개를 짓는 법·토큰·훅으로 바꾸고 picks 를 사건으로 잇는다

**Files:**
- Modify: `apps/web/src/modules/*/*/action/*.action.ts` 열한 개
- Modify: `apps/web/src/modules/*/index.ts` 여덟 개 — 토큰·짓는 법·사건을 내보낸다
- Modify: `apps/web/src/composition/{createContainer.ts, propagation.ts}`
- Create: `apps/web/src/composition/propagation.test.ts`
- Create: `apps/web/src/modules/picks/PicksCard/action/savePick.action.test.ts`
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/action/checkPopularity.action.test.ts`
- Delete: `apps/web/src/shared/lib/fetchJson(.test).ts`

**Interfaces:**
- Consumes: Task 1·2 전부
- Produces: 아래 표의 토큰과 짓는 법. 훅 이름과 훅이 돌려주는 모양은 지금 그대로다.

| 유스케이스 파일 | 토큰 | 짓는 법 | 짓는 법이 내놓는 것 |
|---|---|---|---|
| `getStatistics.action.ts` | `STATISTICS` | `createStatisticsCache(http)` | 조건이 `void` 인 캐시 |
| `getLotterietusStatus.action.ts` | `LOTTERIETUS_STATUS` | `createLotterietusStatusCache(http)` | 조건이 `void` 인 캐시 |
| `listPicks.action.ts` | `LIST_PICKS` | `createListPicksCache(http)` | 조건이 `void` 인 캐시 |
| `checkResults.action.ts` | `CHECK_RESULTS` | `createCheckResultsCache(http)` | 조건이 `void` 인 캐시 |
| `checkPopularity.action.ts` | `CHECK_POPULARITY` | `createPopularityCache(http)` | 조건이 조합 문자열(`"1,2,3,4,5,6"`)인 캐시 |
| `savePick.action.ts` | `SAVE_PICK` | `createSavePick(http, events)` | `(numbers: readonly number[]) => Promise<void>` |
| `deletePick.action.ts` | `DELETE_PICK` | `createDeletePick(http, events)` | `(id: string) => Promise<void>` |
| `generateCombination.action.ts` | `GENERATE_COMBINATION` | `createGenerateCombination(http)` | 요청 한 번을 하고 표시 모델을 돌려주는 함수 |
| `evaluateAssumption.action.ts` | `EVALUATE_ASSUMPTION` | `createEvaluateAssumption(http)` | 요청 한 번을 하고 표시 모델을 돌려주는 함수 |
| `generateAssumed.action.ts` | `GENERATE_ASSUMED` | `createGenerateAssumed(http)` | 요청 한 번을 하고 표시 모델을 돌려주는 함수 |
| `backtestCombination.action.ts` | `BACKTEST_COMBINATION` | `createBacktestCombination(http)` | 요청 한 번을 하고 표시 모델을 돌려주는 함수 |

picks 가 내는 사건은 둘이다. 모양은 [frontend-module-layout §3.3 바꾸는 action — 사건을 낸다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#33-바꾸는-action--사건을-낸다>)를 따른다.

- `savePick.action.ts` 는 `PICKS_SAVED = 'picks.saved'` 와 `interface PicksSaved { numbers: readonly number[] }` 를 내놓는다.
- `deletePick.action.ts` 는 `PICKS_REMOVED = 'picks.removed'` 와 `interface PicksRemoved { id: string }` 를 내놓는다.

- [ ] **Step 1: 실패하는 시험을 쓴다.** 세 시험 모두 `createContainer('test')` 로 짓고 `TEST_HTTP` 로 응답을 정한다.
  - `propagation.test.ts`
    - 「픽을 저장하면 목록 캐시가 다시 받는다」: `/api/picks` GET 응답을 정하고 `LIST_PICKS` 를 구독·`ensure` 한다. `SAVE_PICK` 을 부른 뒤 `/api/picks` GET 이 `sent` 에 두 번 있다.
    - 「픽을 지우면 목록 캐시가 다시 받는다」: 같은 모양으로 `DELETE_PICK('a b')` 를 부른다. 경로 `/api/picks/a%20b` 로 DELETE 가 간다.
    - 「픽을 저장해도 당첨 대조 캐시는 다시 받지 않는다」: `/api/results` GET 이 `sent` 에 한 번만 있다(Review Focus 3).
  - `savePick.action.test.ts` — 「실패하면 사건을 내지 않는다」: `/api/picks` POST 응답이 throw 하면 `PICKS_SAVED` 리스너가 불리지 않는다.
  - `checkPopularity.action.test.ts` — `renderHook` 에 `ContainerProvider` 를 `wrapper` 로 준다(Review Focus 5).
    - 「조합이 null 이면 요청하지 않는다」: `sent` 길이가 0 이다.
    - 「조합이 바뀌면 앞 조합의 늦은 응답을 보이지 않는다」: 첫 조합의 응답을 미뤄 두고 `rerender` 로 조합을 바꾼다. 그 뒤 첫 응답을 풀어도 `result` 가 두 번째 조합의 값이거나 `null` 이다.

- [ ] **Step 2: 시험이 실패하는지 돌린다.**
  Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/composition src/modules/picks src/modules/hypothesis`
  Expected: 토큰과 짓는 법이 없어 FAIL 한다.

- [ ] **Step 3: 조회 action 다섯을 바꾼다.** 꼴은 [frontend-module-layout §3.2 조회 action — 짓는 법과 그것을 꺼내는 훅](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#32-조회-action--짓는-법과-그것을-꺼내는-훅>)이다. 규격 예와 다른 점이 둘 있다.
  - **`useSyncExternalStore` 의 세 번째 인자 `readOnServer`(`() => undefined`)를 지금처럼 넘긴다.** 규격 예에는 없지만, 빼면 Next 가 서버에서 그릴 때 실패한다.
  - **`checkResults` 의 `check` 와 `retry` 는 지금 그대로 자기 캐시의 수명으로 남긴다.** `read() ? invalidate() : ensure()` 꼴이다.
  - `checkPopularity` 는 지금 훅 안의 `useEffect` 와 `stale` 플래그로 한 일을 캐시로 옮긴다. 캐시키가 조합 문자열이므로, 늦은 응답을 버리는 일은 캐시 도구의 `turns` 가 맡는다. 조합이 `null` 이면 구독하지도 `ensure` 하지도 않고 `{ result: null, error: null }` 을 돌려준다. 오류 문구 기본값 「인기 패턴 확인에 실패했습니다」는 짓는 법 안에서 지킨다.

- [ ] **Step 4: 바꾸는 action 둘과 캐시 없는 action 넷을 바꾼다.**
  - 짓는 법은 요청 한 번을 하는 함수를 내놓는다. 진행·오류·`clearError`, 그리고 결과를 쥐는 action 의 `result` 는 지금처럼 훅 안에 둔다.
  - `savePick`·`deletePick` 은 성공한 뒤 사건을 내고, 어떤 캐시도 부르지 않는다. 두 파일 머리의 「목록 캐시를 여기서 버린다」 주석은 지운다.
  - 오류 문구 기본값(「저장에 실패했습니다」 등)은 지금 그대로다.

- [ ] **Step 5: 배럴과 조립 루트를 잇는다.**
  - 각 `modules/<도메인>/index.ts` 가 표의 토큰·짓는 법과 picks 의 사건 이름·값 타입을 다시 내보낸다.
  - `createContainer` 2단계에 열한 줄을 등록한다. 경로는 `@/modules/<도메인>` 이고, Task 4 에서 `@app/(home)` 으로 바뀐다.
  - `propagation.ts` 에 두 줄과 주석 한 줄을 적는다.
    - `PICKS_SAVED` → `LIST_PICKS.invalidate()` (출처: 이 탭)
    - `PICKS_REMOVED` → `LIST_PICKS.invalidate()` (출처: 이 탭)
    - 주석: 「픽 저장·삭제는 `CHECK_RESULTS` 를 무효화하지 않는다 — 결과 확인은 사람이 「당첨 대조」를 눌러 받는 값이다」
  - `checkResults.action.ts` 의 같은 내용 주석은 「`composition/propagation.ts` 에 적혀 있다」로 줄인다.

- [ ] **Step 6: `fetchJson` 을 지운다.** 남은 참조가 0 인지 `grep -r fetchJson apps/web/src` 로 확인한다.

- [ ] **Step 7: 검증한다.**
  Run: `pnpm check`
  Expected: 통과한다. 표시 조정자 시험은 고치지 않았는데도 통과해야 한다. 훅이 돌려주는 모양을 바꾸지 않았기 때문이다.

- [ ] **Step 8: 커밋한다.**
  `refactor(web): action 을 짓는 법·토큰·훅으로 바꾸고 picks 무효화를 propagation 으로 옮긴다`

### Task 4: `app/(home)/` 로 다시 배치하고 검사기를 개정판으로 바꾼다

이 Task 는 한 커밋이다. 검사기를 고치지 않은 채 옮기면 `pnpm check` 가 깨지고, 옮기지 않은 채 검사기만 고쳐도 깨지기 때문이다.

**Files:**
- Move: `apps/web/src/app/{page.tsx, Home.presenter.ts, Home.presenter.test.ts}` → `apps/web/src/app/(home)/`
- Move: `apps/web/src/modules/<도메인>/<View>/` → `apps/web/src/app/(home)/<View>/` (일곱). `action/`·`mapper/`·`model/` → `_action/`·`_mapper/`·`_model/`
- Move: `apps/web/src/modules/identity/IdentityBadge(.presenter).tsx|ts` → `apps/web/src/app/(home)/`
- Create: `apps/web/src/app/(home)/index.ts`
- Delete: `apps/web/src/modules/` (배럴 여덟 포함)
- Modify: `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `tsconfig.depcruise.json` — `@/*` 를 지운다
- Modify: `.dependency-cruiser.cjs`, `tools/checks/violations-config.cjs`, `apps/web/eslint.config.mjs`, `tools/checks/eslint-violations.config.mjs`
- Modify: `tools/checks/{violations, allowed, eslint-violations, eslint-allowed}/` 의 화면 앱 표본

**Interfaces:**
- Consumes: Task 3 의 토큰·짓는 법·사건
- Produces: `@app/(home)` — 표의 토큰 열한 개, 짓는 법 열한 개, `PICKS_SAVED`·`PicksSaved`·`PICKS_REMOVED`·`PicksRemoved`. 페이지 컴포넌트·조정자·훅·변환기는 내보내지 않는다([frontend-module-layout §8 공개 표면 — 배럴이 내보내는 것](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#8-공개-표면--배럴이-내보내는-것>)).

- [ ] **Step 1: 옮긴다.**
  - 위 목록대로 `git mv` 한다.
  - 각 `<View>/index.tsx` 는 지금처럼 컴포넌트와 `*Props` 를 정의한다. 거기에 더해 자기 `_action/` 의 토큰·짓는 법(·사건)을 다시 내보낸다.
  - `(home)/index.ts` 는 일곱 뷰 폴더의 배선 재료만 다시 내보낸다.
  - `page.tsx` 와 `Home.presenter.ts` 는 `./GeneratorCard` 처럼 상대 경로로 자식 뷰 폴더의 `index` 를 가져온다.
  - `StatisticsPanel` 의 자식 여덟과 `_model/Statistics.viewmodel` 은 지금 자리 그대로 둔다([fractal-view-promotion §3 소유물의 자리 — 소비자를 세어 정한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md#3-소유물의-자리--소비자를-세어-정한다>)).

- [ ] **Step 2: import 를 다시 쓴다.**
  - `@/shared/lib/*` 는 `@lib/*` 로, `@/shared/ui/*` 는 `@ui/*` 로 바꾼다.
  - 같은 화면 모듈 안은 상대 경로로 쓴다. `createContainer`·`propagation` 은 `@app/(home)` 을 가져온다.
  - `@/*` 별칭 세 곳을 지운다. `grep -rn '"@/' apps/web/src` 가 0 줄이어야 한다.

- [ ] **Step 3: dependency-cruiser 규칙을 바꾼다.**
  - 화면 앱 규칙을 [boundary-enforcement §3 의존 규칙 — 설정 전문](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#3-의존-규칙--설정-전문>)의 화면 앱 몫으로 바꾼다. 설정 머리의 `screenModules()` 와 다음 규칙들이 든다.
    - `contract-only-in-mapper`, `no-deep-screen-or-widget-import`, `screen-must-not-reach-screen`, `shell-sees-no-screen-or-widget`, `shared-stays-in-shared`
    - `widget-must-not-reach-widget`, `only-combined-reaches-widgets`, `mapper-only-from-action`, `nothing-reaches-composition`
    - `infrastructure-reaches-lib-only`, `screen-sees-infrastructure-types-only`, `shell-reaches-no-infrastructure`, `endpoint-only-in-api`
    - `no-root-screen`, `dev-seats-not-from-prod`, `middleware-sees-infrastructure-lib-routes-only`
  - 경로 접두는 이 저장소의 `^apps/web/src/` 로 맞춘다.
  - 이 저장소 규칙 `web-must-not-reach-kernel` 은 남긴다.
  - 옛 `no-deep-module-import` 와 `modules/` 기준의 `mapper-only-from-action` 은 지운다.
  - 서버 쪽 규칙은 손대지 않는다. `no-cross-module-import` 의 `pathNot: '^apps/web/'` 도 그대로 둔다.
  - `tools/checks/violations-config.cjs` 도 같은 규칙을 보게 맞춘다.

- [ ] **Step 4: ESLint 를 바꾼다.**
  - [boundary-enforcement §4 코드 모양 규칙 — ESLint](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#4-코드-모양-규칙--eslint>)의 전문을 옮긴다. 다음이 든다.
    - `VIEW_STATE`·`VIEW_STATE_MEMBER`(이 저장소가 더한 멤버 호출 꼴, 남긴다)·`VIEWMODEL_SPREAD`
    - `hook-resolves-own-token-only` 두 갈래. infrastructure 토큰 목록은 `HTTP_CLIENT|DOMAIN_EVENTS|TEST_HTTP` 다.
    - `no-path-literal`, `no-root-alias`
  - 글롭은 `src/app/**`·`src/widgets/**` 다.
  - 뷰 폴더 공개 표면 규칙(대문자 폴더 안쪽 금지)은 `src/app/**` 에 다시 건다. 별칭 꼴 패턴은 `@app/` 기준으로 바꾼다.
  - `AppContainer.tsx` 와 `*.presenter.tsx` 는 상태 금지에서 뺀다.

- [ ] **Step 5: 표본을 다시 쓴다.**
  - Step 3·4 의 규칙마다 위반 표본을 하나씩 둔다. 폴더 이름이 곧 규칙 이름이다([boundary-enforcement §5 검사기 자체를 검증한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#5-검사기-자체를-검증한다>)).
  - 위젯·middleware·놀이터 규칙도 표본은 둔다. 표본은 가상의 폴더라서 이 저장소에 그 층이 없어도 된다.
  - 지우는 표본:
    - `violations/no-deep-module-import*`
    - `allowed/no-deep-module-import--barrel` — 배럴 허용은 이제 화면 모듈끼리 금지다
  - 고치는 표본:
    - `allowed/mapper-only-from-action--mapper` 의 경로를 `app/x/_action`·`_mapper` 로 바꾼다.
    - `eslint-violations/*` 의 경로를 `src/app/` 기준으로 바꾼다.
  - 더하는 허용 표본: `allowed/screen-reaches-own-owned` — 같은 화면 모듈 안에서 `../_model/` 을 상대 경로로 가져오는 것.

- [ ] **Step 6: 검증한다.**
  - Run: `pnpm check` — 통과한다.
  - Run: `bash tools/checks/run-violations.sh` — 모든 줄이 `OK` 다.
  - Run: `pnpm check:migration` — 「옛 구역 파일: 0」.
  - `pnpm dev` 로 다섯 탭을 한 번씩 눌러 보고, 픽 저장 → 목록 갱신을 손으로 확인한다.

- [ ] **Step 7: 커밋한다.**
  `refactor(web): 화면 조각을 app/(home)/ 의 자식 뷰로 옮기고 검사기를 개정판 규칙으로 바꾼다`

### Task 5: 문서를 맞춘다

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/reports/2026-10-13-vault-feedback.md`

- [ ] **Step 1: CLAUDE.md 「이 저장소가 정한 것」을 고친다.**
  - 「`no-deep-module-import` 는 다른 모듈의 배럴을 허용한다」 항목을 지운다. 화면 모듈이 하나뿐이고, 개정판은 화면 모듈끼리 배럴 import 도 금지한다는 한 줄로 대신한다.
  - 서버 상태 캐시 항목: 자리를 `apps/web/src/infrastructure/serverCache.ts` 로, 링크를 [frontend-module-layout §3.1 캐시 도구 — infrastructure 에 하나](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#31-캐시-도구--infrastructure-에-하나>)로 고친다.
  - 프록시 항목: `shared/lib/apiProxy.ts` 를 `infrastructure/apiProxy.ts` 로 고친다.
  - 셸의 조정자 항목: `apps/web/src/app/(home)/Home.presenter.ts` 로 고친다.
  - 「`picks` 의 저장·삭제는 `results` 캐시를 무효화하지 않는다」 항목: 출처를 `composition/propagation.ts` 로 고친다.
  - 새 항목: 「컨테이너는 `composition/createContainer.ts` 가 짓고 `app/AppContainer.tsx` 가 내린다. 시험은 `createContainer('test')` 와 `TEST_HTTP` 를 쓴다」.
  - 새 항목: 규격 코드와 다르게 지킨 셋.
    - `FetchHttpClient` 의 서버 오류 문구 꺼내기
    - `serverCache` 의 `void` 조건 `invalidate`
    - `readOnServer`

- [ ] **Step 2: CLAUDE.md 의 끊긴 링크를 고친다.** 「아키텍처 — vault 골조를 가리킨다」의 `frontend-module-layout`·`fractal-view-promotion` 링크를 `architecture/frontend/` 아래로 고친다. 같은 절에 `frontend-app-layers` 줄을 더한다. 문서 수는 「여덟 장」에서 실제 수로 고친다. 뼈대 트리의 `apps/web/` 줄은 `src/app/(home)/, src/composition/, src/infrastructure/, src/shared/{ui,lib}/` 로 고친다.

- [ ] **Step 3: vault 보고 문서에 셋을 더한다.**
  - (a) 규격 `FetchHttpClient` 는 서버 본문의 오류 문구를 버린다. 계약이 「도메인 실패는 메시지를 실은 400」을 정한 저장소에서는 화면 문구가 사라진다.
  - (b) 규격 `serverCache.invalidate` 의 `query !== undefined` 판별은 조건이 `void` 인 캐시를 다시 받지 못한다.
  - (c) 규격 §3.2 예의 `useSyncExternalStore` 에 `getServerSnapshot` 이 없어, Next 서버 렌더에서 실패한다.

- [ ] **Step 4: 검증하고 커밋한다.**
  - Run: `pnpm check` — 통과한다. 문서만 바뀌었으므로 확인용이다.
  - 커밋: `docs: 화면 골조 재작업에 맞춰 CLAUDE.md 를 고치고 vault 보고에 어긋남 셋을 올린다`

---

## 이 계획 밖 — 별도 계획으로 남긴 것

디자인 케이스 정렬(standard-light 의 단추 네 등급, 탭 모양 하나, `focus-visible`, 빈 화면, 아이콘)은 이 계획에서 뺐다. 사용자가 정할 것이 둘 남아 있기 때문이다.

- 초록 주 단추를 유지할지
- 탭 모양과, 카드마다 선 strong 단추를 어떻게 볼지

이 계획을 마친 뒤 시작하면 경로 충돌이 없다.
